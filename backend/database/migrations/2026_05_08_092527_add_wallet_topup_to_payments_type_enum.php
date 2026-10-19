<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds 'wallet_topup' to the `payments.type` enum.
     *
     * Driver notes:
     *   - SQLite  : no ENUM enforcement — skip (used in unit tests)
     *   - MySQL   : ALTER TABLE … MODIFY COLUMN … ENUM(…)
     *   - PostgreSQL : drop the existing CHECK constraint, then add a new one
     *                  (PostgreSQL does not support MODIFY COLUMN ENUM syntax)
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return; // SQLite doesn't enforce ENUM; no-op
        }

        if ($driver === 'pgsql') {
            // Drop the existing check constraint (Laravel names it <table>_<column>_check)
            DB::statement("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check");
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_type_check
                CHECK (type IN ('reservation', 'market_fee', 'wallet_topup'))");
            return;
        }

        // MySQL / MariaDB
        DB::statement("ALTER TABLE payments MODIFY COLUMN type ENUM('reservation', 'market_fee', 'wallet_topup') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check");
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_type_check
                CHECK (type IN ('reservation', 'market_fee'))");
            return;
        }

        // MySQL / MariaDB
        DB::statement("ALTER TABLE payments MODIFY COLUMN type ENUM('reservation', 'market_fee') NOT NULL");
    }
};

