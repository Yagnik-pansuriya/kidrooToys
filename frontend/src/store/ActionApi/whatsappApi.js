import { baseApi } from '../Api';

export const whatsappApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/admin/whatsapp/offers/:id?targetGroup=  — preview, audience size, last send
    getOfferWhatsAppInfo: builder.query({
      query: ({ id, targetGroup = 'all' }) => `admin/whatsapp/offers/${id}?targetGroup=${targetGroup}`,
      providesTags: (result, error, { id }) => [{ type: 'WhatsAppOffer', id }],
    }),

    // POST /api/admin/whatsapp/offers/:id/send  — { targetGroup, testMobile?, resend? }
    sendOfferOnWhatsApp: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/whatsapp/offers/${id}/send`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id, testMobile }) =>
        testMobile ? [] : [{ type: 'WhatsAppOffer', id }, 'SmsCampaigns'],
    }),

    // GET /api/admin/whatsapp/carts/:customerId  — last cart message
    getCartWhatsAppInfo: builder.query({
      query: (customerId) => `admin/whatsapp/carts/${customerId}`,
      providesTags: (result, error, id) => [{ type: 'WhatsAppCart', id }],
    }),

    // POST /api/admin/whatsapp/carts/:customerId/send  — { message }
    sendCartReminderOnWhatsApp: builder.mutation({
      query: ({ customerId, message }) => ({
        url: `admin/whatsapp/carts/${customerId}/send`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: 'WhatsAppCart', id: customerId }, 'SmsCampaigns'],
    }),

  }),
});

export const {
  useGetOfferWhatsAppInfoQuery,
  useSendOfferOnWhatsAppMutation,
  useGetCartWhatsAppInfoQuery,
  useSendCartReminderOnWhatsAppMutation,
} = whatsappApi;
