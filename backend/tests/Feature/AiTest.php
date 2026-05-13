<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class AiTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_endpoint_requires_auth()
    {
        $response = $this->postJson('/api/ai/chat', ['message' => 'Hello']);
        $response->assertStatus(401);
    }

    public function test_chat_returns_ai_response()
    {
        config(['services.gemini.key' => 'fake-key']);
        $user = User::factory()->create();
        
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Hello! I am Soko AI.']
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        $response = $this->actingAs($user)->postJson('/api/ai/chat', ['message' => 'Hi']);
        
        $response->assertStatus(200)
            ->assertJsonPath('data.response', 'Hello! I am Soko AI.');
    }

    public function test_suggest_description_returns_suggestion()
    {
        config(['services.gemini.key' => 'fake-key']);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Fresh and organic sukuma wiki.']
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        $response = $this->getJson('/api/ai/suggest-description?name=Sukuma%20Wiki');
        
        $response->assertStatus(200)
            ->assertJsonPath('data.suggestion', 'Fresh and organic sukuma wiki.');
    }
}
