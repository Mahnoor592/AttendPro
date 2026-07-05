<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $passwords = [
            1 => 'admin123',
            2 => 'admin123',
            3 => 'employee123',
            4 => 'employee123',
            5 => 'employee123',
            6 => 'employee123',
        ];

        foreach ($passwords as $id => $plain) {
            $user = User::find($id);
            if ($user) {
                $user->password = $plain;
                $user->save();
            }
        }
    }
}
