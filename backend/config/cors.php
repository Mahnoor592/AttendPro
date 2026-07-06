<?php

return [
    'paths'                    => ['api/*'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [env('FRONTEND_URL', 'http://localhost:5173')],
    // Allow any of this project's Vercel URLs (production + preview deploys).
    'allowed_origins_patterns' => ['#^https://.*\.vercel\.app$#'],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
