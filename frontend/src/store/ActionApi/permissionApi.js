import { baseApi } from '../Api';

export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/permissions/routes  —  available route list for dropdown
    getAvailableRoutes: builder.query({
      query: () => 'permissions/routes',
      providesTags: ['PermissionRoutes'],
    }),

    // GET /api/permissions/:userId  —  get permissions for a specific user
    getUserPermissions: builder.query({
      query: (userId) => `permissions/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'Permissions', id: userId }],
    }),

    // PUT /api/permissions/:userId  —  overwrite full permission set
    updatePermissions: builder.mutation({
      query: ({ userId, permissions }) => ({
        url: `permissions/${userId}`,
        method: 'PUT',
        body: { permissions },
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'Permissions', id: userId }],
    }),

    // PATCH /api/permissions/:userId  —  patch single permission
    patchPermission: builder.mutation({
      query: ({ userId, permission }) => ({
        url: `permissions/${userId}`,
        method: 'PATCH',
        body: permission,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'Permissions', id: userId }],
    }),

  }),
});

export const {
  useGetAvailableRoutesQuery,
  useGetUserPermissionsQuery,
  useUpdatePermissionsMutation,
  usePatchPermissionMutation,
} = permissionApi;
