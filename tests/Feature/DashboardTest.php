<?php

namespace Tests\Feature;

use App\Models\ClientLink;
use App\Models\PortalAccessGrant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_with_active_grant_can_visit_the_dashboard()
    {
        Http::fake([
            '*/api/v1/projects*' => Http::response(['data' => [], 'links' => [], 'meta' => []], 200),
        ]);

        $user = User::factory()->withPortalAccess()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_dashboard_shows_unreachable_state_when_erp_is_down()
    {
        Http::fake(function () {
            throw new \Illuminate\Http\Client\ConnectionException('connection failed');
        });

        $user = User::factory()->withPortalAccess()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('erpUnreachable', true));
    }

    public function test_users_without_active_grant_are_blocked_even_if_logged_in()
    {
        // erp_client_id ini sengaja TIDAK punya PortalAccessGrant sama sekali
        // (revoke/belum diprovisioning) — middleware harus tolak.
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertForbidden();
    }

    public function test_one_account_aggregates_projects_from_multiple_linked_clients()
    {
        // Skenario nyata: 1 orang jadi pengawas PT A (klien 101) tapi juga
        // punya proyek pribadi terpisah (klien 202) — 1 login harus lihat
        // proyek dari KEDUA klien di dashboard yang sama.
        $user = User::factory()->create();

        PortalAccessGrant::create(['erp_client_id' => 101, 'erp_api_token' => 'token-a', 'status' => 'active', 'granted_at' => now()]);
        PortalAccessGrant::create(['erp_client_id' => 202, 'erp_api_token' => 'token-b', 'status' => 'active', 'granted_at' => now()]);
        ClientLink::create(['user_id' => $user->id, 'erp_client_id' => 101, 'erp_client_name' => 'PT A']);
        ClientLink::create(['user_id' => $user->id, 'erp_client_id' => 202, 'erp_client_name' => 'Proyek Pribadi']);

        Http::fake([
            '*/api/v1/projects*' => function ($request) {
                $token = $request->header('Authorization')[0] ?? '';
                $projectId = str_contains($token, 'token-a') ? 1 : 2;
                $name = str_contains($token, 'token-a') ? 'Proyek PT A' : 'Proyek Pribadi Budi';

                return Http::response(['data' => [
                    ['id' => $projectId, 'name' => $name, 'job_number' => null, 'pipeline_stage' => 'pelaksanaan', 'status' => 'active', 'location' => null, 'jenis_pekerjaan' => null],
                ], 'links' => [], 'meta' => []], 200);
            },
        ]);

        $this->actingAs($user);
        $response = $this->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('showClientLabel', true)
            ->has('projects', 2)
            ->where('projects.0.erp_client_id', 101)
            ->where('projects.1.erp_client_id', 202)
        );
    }
}
