<script lang="ts">
  /**
   * Profile page component for SvelteKit.
   */
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth';

  let isEditing = $state(false);
  let isChangingPassword = $state(false);
  let isLoading = $state(false);
  let message = $state({ type: '', text: '' });

  let formName = $state(auth.user?.name || '');

  let passwordData = $state({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Sync form with user data
  $effect(() => {
    if (auth.user) {
      formName = auth.user.name || '';
    }
  });

  async function handleUpdateProfile(e: Event) {
    e.preventDefault();
    isLoading = true;
    message = { type: '', text: '' };

    try {
      await auth.updateProfile({ name: formName });
      isEditing = false;
      message = { type: 'success', text: 'Profile updated successfully' };
    } catch (err) {
      message = { type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' };
    } finally {
      isLoading = false;
    }
  }

  async function handleChangePassword(e: Event) {
    e.preventDefault();
    message = { type: '', text: '' };

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message = { type: 'error', text: 'New passwords do not match' };
      return;
    }

    if (passwordData.newPassword.length < 8) {
      message = { type: 'error', text: 'Password must be at least 8 characters' };
      return;
    }

    isLoading = true;
    try {
      await auth.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      isChangingPassword = false;
      passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      message = { type: 'success', text: 'Password changed successfully' };
    } catch (err) {
      message = { type: 'error', text: err instanceof Error ? err.message : 'Failed to change password' };
    } finally {
      isLoading = false;
    }
  }

  async function handleLogout() {
    await auth.logout();
    goto('/login');
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    isLoading = true;
    try {
      await auth.deleteAccount();
      goto('/login');
    } catch (err) {
      message = { type: 'error', text: err instanceof Error ? err.message : 'Failed to delete account' };
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Profile</title>
</svelte:head>

{#if auth.isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
{:else if !auth.user}
  <div class="min-h-screen flex items-center justify-center">
    <p>Please <a href="/login" class="text-blue-600">sign in</a> to view your profile.</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      {#if message.text}
        <div class="mb-6 rounded-md p-4 {message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
          {message.text}
        </div>
      {/if}

      <!-- Profile Info -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Account Information</h2>

        {#if isEditing}
          <form onsubmit={handleUpdateProfile} class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                type="text"
                bind:value={formName}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div class="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onclick={() => isEditing = false}
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        {:else}
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-500">Email</label>
              <p class="mt-1 text-gray-900">{auth.user.email}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Name</label>
              <p class="mt-1 text-gray-900">{auth.user.name || '-'}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Member since</label>
              <p class="mt-1 text-gray-900">
                {new Date(auth.user.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onclick={() => isEditing = true}
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Edit Profile
            </button>
          </div>
        {/if}
      </div>

      <!-- Change Password -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Security</h2>

        {#if isChangingPassword}
          <form onsubmit={handleChangePassword} class="space-y-4">
            <div>
              <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                bind:value={passwordData.currentPassword}
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                bind:value={passwordData.newPassword}
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                bind:value={passwordData.confirmPassword}
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div class="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onclick={() => {
                  isChangingPassword = false;
                  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
                }}
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        {:else}
          <button
            onclick={() => isChangingPassword = true}
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Change Password
          </button>
        {/if}
      </div>

      <!-- Actions -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Account Actions</h2>
        <div class="space-y-4">
          <button
            onclick={handleLogout}
            class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Sign Out
          </button>
          <button
            onclick={handleDeleteAccount}
            disabled={isLoading}
            class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
