<?php

namespace App\Services;

use App\Models\Market;
use App\Models\Stall;

class StallService
{
    /**
     * Generate standard stall infrastructure for a market hub.
     * Based on the standard 3-block government market layout.
     */
    public function generateStandardInfrastructure(Market $market): void
    {
        $blocks = ['A', 'B', 'C'];
        $rows = 6;
        
        foreach ($blocks as $block) {
            $this->createBlockStalls($market->id, $block, $rows);
        }
    }

    /**
     * Create stalls for a specific block.
     */
    private function createBlockStalls(int $marketId, string $block, int $rowCount): void
    {
        $zones = [
            'A' => ['prefix' => '', 'x' => 40],
            'B' => [
                ['prefix' => 'L', 'x' => 140], // BL1, BL2...
                ['prefix' => 'R', 'x' => 330]  // BR1, BR2...
            ],
            'C' => ['prefix' => '', 'x' => 430]
        ];

        for ($i = 1; $i <= $rowCount; $i++) {
            $y = 100 + (($i - 1) * 80); // 100, 180, 260, 340, 420, 500

            foreach ($zones as $zoneName => $config) {
                if ($zoneName === 'B') {
                    // Zone B has two sub-columns
                    foreach ($config as $subConfig) {
                        Stall::create([
                            'market_id' => $marketId,
                            'block' => $block,
                            'zone' => $zoneName,
                            'stall_number' => $zoneName . $subConfig['prefix'] . $i,
                            'map_x' => $subConfig['x'],
                            'map_y' => $y,
                            'status' => 'available',
                            'monthly_fee' => 1500.00, // Standard starting fee
                            'size_sqm' => 4.00,
                        ]);
                    }
                } else {
                    Stall::create([
                        'market_id' => $marketId,
                        'block' => $block,
                        'zone' => $zoneName,
                        'stall_number' => $zoneName . $i,
                        'map_x' => $config['x'],
                        'map_y' => $y,
                        'status' => 'available',
                        'monthly_fee' => 1500.00,
                        'size_sqm' => 4.00,
                    ]);
                }
            }
        }
    }
}
