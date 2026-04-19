import { baseApi, API_ENDPOINTS } from '../Api';

const buildSettingsFormData = (body) => {
  const fd = new FormData();
  
  // scalar fields
  const scalarFields = ['siteName', 'tagline', 'contactEmail', 'contactPhone'];
  scalarFields.forEach(k => {
    if (body[k] !== undefined && body[k] !== '') {
      fd.append(k, body[k]);
    }
  });

  // Theme colors as JSON stringified object
  if (body.themeColors) {
    fd.append('themeColors', JSON.stringify(body.themeColors));
  }

  // Payment methods as JSON stringified object
  if (body.paymentMethods) {
    fd.append('paymentMethods', JSON.stringify(body.paymentMethods));
  }

  // Razorpay config (sent as individual fields, not nested)
  if (body.razorpayKeyId !== undefined) {
    fd.append('razorpayKeyId', body.razorpayKeyId);
  }
  if (body.razorpayKeySecret !== undefined && body.razorpayKeySecret !== '') {
    fd.append('razorpayKeySecret', body.razorpayKeySecret);
  }

  // Logo file handling
  if (body.logoFile instanceof File) {
    fd.append('logo', body.logoFile);
  } else if (typeof body.logo === 'string' && body.logo !== '') {
    fd.append('logo', body.logo); // existing logo URL
  }

  return fd;
};

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => API_ENDPOINTS.SITE_SETTINGS,
      providesTags: ['SiteSettings'],
    }),

    updateSettings: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.SITE_SETTINGS,
        method: 'PUT',
        body: buildSettingsFormData(body),
        formData: true,
      }),
      invalidatesTags: ['SiteSettings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
