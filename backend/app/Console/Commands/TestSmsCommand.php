<?php

namespace App\Console\Commands;

use App\Services\AfricasTalkingService;
use Illuminate\Console\Command;

class TestSmsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sms:test {phone : The destination phone number} {message : The message to send}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test sending an SMS via Africa\'s Talking';

    /**
     * Execute the console command.
     */
    public function handle(AfricasTalkingService $smsService)
    {
        $phone = $this->argument('phone');
        $message = $this->argument('message');

        $this->info("Attempting to send SMS to {$phone}...");
        $this->line("Message: {$message}");

        $result = $smsService->sendSms($phone, $message);

        if ($result['status'] === 'success') {
            $this->info('SMS sent successfully!');
            $this->table(['Key', 'Value'], [
                ['Status', 'Success'],
                ['Response', json_encode($result['data'])]
            ]);
        } else {
            $this->error('Failed to send SMS.');
            $this->error("Error: {$result['message']}");
        }

        return 0;
    }
}
