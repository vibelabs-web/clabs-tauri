<script lang="ts">
  /**
   * Registration page component for SvelteKit.
   */
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errorMessage = '';

    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match';
      return;
    }

    if (password.length < 8) {
      errorMessage = 'Password must be at least 8 characters';
      return;
    }

    isSubmitting = true;

    try {
      await auth.register({
        email,
        password,
        name: name || undefined,
      });
      goto('/');
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Registration failed';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Create Account</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Or
        <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
          sign in to existing account
        </a>
      </p>
    </div>

    <form class="mt-8 space-y-6" onsubmit={handleSubmit}>
      {#if errorMessage}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-700">{errorMessage}</p>
        </div>
      {/if}

      <div class="rounded-md shadow-sm space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">
            Name (optional)
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autocomplete="name"
            bind:value={name}
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Your name"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            bind:value={password}
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            bind:value={confirmPassword}
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Confirm your password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  </div>
</div>
