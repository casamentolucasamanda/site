<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login utilizando Username (Usuário) em vez de E-mail.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            /** @var \App\Models\User $user */
            $user = Auth::user();

            return response()->json([
                'status' => 'sucesso',
                'usuario' => [
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ]);
        }

        throw ValidationException::withMessages([
            'username' => ['O usuário ou senha fornecidos estão incorretos.'],
        ]);
    }

    /**
     * Cadastro de novos usuários (Exclusivo para uso dos Noivos).
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['string', 'in:convidado,noivos']
        ]);

        $novoUsuario = User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'] ?? 'convidado',
        ]);

        return response()->json([
            'status' => 'sucesso',
            'mensagem' => 'Convidado cadastrado com sucesso!',
            'id' => $novoUsuario->id
        ], 201);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['status' => 'sucesso']);
    }
}