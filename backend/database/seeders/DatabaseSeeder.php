<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // There is no public signup route, so this seeder is the bootstrap path: it guarantees
        // the instance always has one administrator who can then create everyone else.
        $this->createFirstAdmin();

        // The shipped SQL dump stores placeholder password hashes, so give the sample
        // accounts usable passwords when someone imports it for a local run.
        $samplePasswords = [
            1 => 'admin123',
            2 => 'admin123',
            3 => 'employee123',
            4 => 'employee123',
            5 => 'employee123',
            6 => 'employee123',
        ];

        foreach ($samplePasswords as $id => $plain) {
            $user = User::find($id);
            if ($user) {
                $user->password = $plain;
                $user->save();
            }
        }
    }

    private function createFirstAdmin(): void
    {
        if (User::where('role', 'admin')->exists()) {
            return;
        }

        $email    = env('ADMIN_EMAIL', 'admin@company.com');
        $password = env('ADMIN_PASSWORD', 'admin123');

        User::create([
            'name'      => env('ADMIN_NAME', 'Admin User'),
            'email'     => $email,
            'password'  => $password,
            'role'      => 'admin',
            'is_active' => true,
        ]);

        $this->command->info("Created first admin: {$email} / {$password}");
        $this->command->warn('Change this password after your first login.');
    }
}
