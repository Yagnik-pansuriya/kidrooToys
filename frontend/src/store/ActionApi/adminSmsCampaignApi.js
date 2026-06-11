import { baseApi } from '../Api';

export const adminSmsCampaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/admin/sms-campaigns/stats
    getSmsCampaignStats: builder.query({
      query: () => 'admin/sms-campaigns/stats',
      providesTags: ['SmsCampaigns'],
      keepUnusedDataFor: 120,
    }),

    // GET /api/admin/sms-campaigns
    getAllSmsCampaigns: builder.query({
      query: () => 'admin/sms-campaigns',
      providesTags: ['SmsCampaigns'],
    }),

    // POST /api/admin/sms-campaigns
    createSmsCampaign: builder.mutation({
      query: (body) => ({
        url: 'admin/sms-campaigns',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SmsCampaigns'],
    }),

    // DELETE /api/admin/sms-campaigns/:id
    deleteSmsCampaign: builder.mutation({
      query: (id) => ({
        url: `admin/sms-campaigns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SmsCampaigns'],
    }),

  }),
});

export const {
  useGetSmsCampaignStatsQuery,
  useGetAllSmsCampaignsQuery,
  useCreateSmsCampaignMutation,
  useDeleteSmsCampaignMutation,
} = adminSmsCampaignApi;
