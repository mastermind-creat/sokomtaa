<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SearchAlias;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

/**
 * Admin CRUD for SearchAlias records.
 *
 * All routes are protected by auth:sanctum + role:admin middleware (see routes/api.php).
 * Requirements: 11.3, 11.4, 11.5
 */
class SearchAliasController extends Controller
{
    use ApiResponse;

    /**
     * List all search aliases.
     */
    public function index(): JsonResponse
    {
        $aliases = SearchAlias::orderBy('language')->orderBy('alias')->get();

        return $this->success($aliases, 'Search aliases retrieved successfully.');
    }

    /**
     * Create a new search alias.
     * On success, invalidates any cached AI expansion for the alias string.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'alias'    => ['required', 'string', 'max:255', Rule::unique('search_aliases', 'alias')],
            'maps_to'  => ['required', 'string', 'max:255'],
            'language' => ['required', 'string', Rule::in(['sw', 'en'])],
        ]);

        $alias = SearchAlias::create($validated);

        Cache::forget('ai_expand_' . strtolower($alias->alias));

        return $this->success($alias, 'Search alias created successfully.', 201);
    }

    /**
     * Update an existing search alias.
     * On success, invalidates cached AI expansions for both the old and new alias strings.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $alias = SearchAlias::find($id);

        if (! $alias) {
            return $this->error('Search alias not found.', 'NOT_FOUND', 404);
        }

        $validated = $request->validate([
            'alias'    => [
                'required',
                'string',
                'max:255',
                Rule::unique('search_aliases', 'alias')->ignore($alias->id),
            ],
            'maps_to'  => ['required', 'string', 'max:255'],
            'language' => ['required', 'string', Rule::in(['sw', 'en'])],
        ]);

        // Invalidate cache for the old alias before updating
        Cache::forget('ai_expand_' . strtolower($alias->alias));

        $alias->update($validated);

        // Also invalidate for the new alias string in case it differs
        Cache::forget('ai_expand_' . strtolower($alias->alias));

        return $this->success($alias, 'Search alias updated successfully.');
    }

    /**
     * Delete a search alias.
     * Invalidates cached AI expansion for the deleted alias string.
     */
    public function destroy(int $id): JsonResponse
    {
        $alias = SearchAlias::find($id);

        if (! $alias) {
            return $this->error('Search alias not found.', 'NOT_FOUND', 404);
        }

        Cache::forget('ai_expand_' . strtolower($alias->alias));

        $alias->delete();

        return $this->success(null, 'Search alias deleted successfully.');
    }
}
