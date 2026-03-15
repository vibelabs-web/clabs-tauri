<script lang="ts">
  /**
   * Login page component for SvelteKit.
   */
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth';

  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isSubmitting = true;
    errorMessage = '';

    try {
      await auth.login({ email, password });
      goto('/');
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Login failed';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Or
        <a href="/register" class="font-medium text-blue-600 hover:text-blue-500">
          create a new account
        </a>
      </p>
    </div>

    <form class="mt-8 space-y-6" onsubmit={handleSubmit}>
      {#if errorMessage}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{errorMessage}</p>
        </div>
      {/if}

      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email" class="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={password}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  </div>
</div>
