<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Region;
use App\Models\County;
use App\Models\Center;

class LocationHierarchySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure a default region exists
        $region = Region::firstOrCreate(
            ['name' => 'Nyanza'],
            ['description' => 'Western region of Kenya', 'is_active' => true]
        );

        // Update "Seme" if it was named incorrectly as a region
        $semeRegion = Region::where('name', 'Seme')->first();
        if ($semeRegion) {
            $semeRegion->update(['name' => 'Nyanza']);
            $region = $semeRegion;
        }

        // 2. Create counties for the region
        $counties = [
            ['name' => 'Kisumu', 'description' => 'Kisumu County'],
            ['name' => 'Siaya', 'description' => 'Siaya County'],
            ['name' => 'Homa Bay', 'description' => 'Homa Bay County'],
        ];

        foreach ($counties as $countyData) {
            County::firstOrCreate(
                ['name' => $countyData['name']],
                ['region_id' => $region->id, 'description' => $countyData['description'], 'is_active' => true]
            );
        }

        // 3. Link existing centers to a default county (Kisumu) if they have no county
        $kisumuCounty = County::where('name', 'Kisumu')->first();
        if ($kisumuCounty) {
            Center::whereNull('county_id')->update(['county_id' => $kisumuCounty->id]);
        }
    }
}
