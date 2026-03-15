/**
 * Profile route for Remix.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { getUser, updateProfile, changePassword, deleteAccount, logoutAPI } from '~/services/auth.server';
import { requireAuth, logout, getToken } from '~/services/session.server';
import type { User } from '~/types/auth';

export const meta: MetaFunction = () => {
  return [{ title: 'Profile' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  try {
    const user = await getUser(token);
    return json({ user });
  } catch {
    return logout(request);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    switch (intent) {
      case 'updateProfile': {
        const name = formData.get('name') as string;
        await updateProfile(token, { name: name || undefined });
        return json({ success: 'Profile updated successfully' });
      }

      case 'changePassword': {
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
          return json({ error: 'New passwords do not match' });
        }

        if (newPassword.length < 8) {
          return json({ error: 'Password must be at least 8 characters' });
        }

        await changePassword(token, {
          current_password: currentPassword,
          new_password: newPassword,
        });
        return json({ success: 'Password changed successfully' });
      }

      case 'logout': {
        await logoutAPI(token);
        return logout(request);
      }

      case 'deleteAccount': {
        await deleteAccount(token);
        return logout(request);
      }

      default:
        return json({ error: 'Unknown action' });
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Action failed' });
  }
}

export default function ProfilePage() {
  const { user } = useLoaderData<{ user: User }>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

        {actionData?.success && (
          <div className="mb-6 rounded-md p-4 bg-green-50 text-green-700">
            {actionData.success}
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 rounded-md p-4 bg-red-50 text-red-700">
            {actionData.error}
          </div>
        )}

        {/* Profile Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>

          {isEditing ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="updateProfile" />
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={user.name || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-gray-900">{user.name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Member since</label>
                <p className="mt-1 text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>

          {isChangingPassword ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="changePassword" />
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </Form>
          ) : (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Change Password
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h2>
          <div className="space-y-4">
            <Form method="post">
              <input type="hidden" name="intent" value="logout" />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Sign Out
              </button>
            </Form>
            <Form method="post" onSubmit={(e) => {
              if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                e.preventDefault();
              }
            }}>
              <input type="hidden" name="intent" value="deleteAccount" />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Account
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
