import { baseApi, API_ENDPOINTS } from '../Api';
import { setSkills } from '../ReducerApi/skillSlice';

export const skillApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSkills: builder.query({
      query: () => API_ENDPOINTS.SKILLS,
      providesTags: ['Skills'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const skillArray = data?.data || data;
          dispatch(setSkills(skillArray));
        } catch (err) {
          console.error('Failed to load skills automatically', err);
        }
      },
    }),

    addSkill: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.SKILLS,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Skills'],
    }),

    updateSkill: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${API_ENDPOINTS.SKILLS}/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Skills'],
    }),

    deleteSkill: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.SKILLS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Skills'],
    }),
  }),
});

export const {
  useGetSkillsQuery,
  useAddSkillMutation,
  useUpdateSkillMutation,
  useDeleteSkillMutation,
} = skillApi;
