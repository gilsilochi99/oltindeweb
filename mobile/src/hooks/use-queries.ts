// TanStack Query hooks wrapping src/lib/data.ts — this is the client-side
// cache layer, playing the role the web app's unstable_cache wrapping plays
// server-side. One hook per data.ts function, named to match.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as data from '../lib/data';
import type { AppUser, Announcement, Claim, Company, FoodOrder, FoodOrderStatus, HealthFacility, HealthFacilityType, Institution, Offer } from '../lib/types';
import type { ReviewableEntityType } from '../lib/data';

export const useActiveCompanies = () =>
  useQuery({ queryKey: ['companies'], queryFn: data.getActiveCompanies });

export const useCompany = (id: string) =>
  useQuery({ queryKey: ['company', id], queryFn: () => data.getCompanyById(id), enabled: !!id });

export const useActiveProfessionals = () =>
  useQuery({ queryKey: ['professionals'], queryFn: data.getActiveProfessionals });

export const useProfessional = (id: string) =>
  useQuery({ queryKey: ['professional', id], queryFn: () => data.getProfessionalById(id), enabled: !!id });

export const useProcedures = () =>
  useQuery({ queryKey: ['procedures'], queryFn: data.getProcedures });

export const useProcedure = (id: string) =>
  useQuery({ queryKey: ['procedure', id], queryFn: () => data.getProcedureById(id), enabled: !!id });

export const useCreateProcedure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: data.ProcedureFormInput) => data.createProcedure(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });
};

export const useUpdateProcedure = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: data.ProcedureFormInput) => data.updateProcedure(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      queryClient.invalidateQueries({ queryKey: ['procedure', id] });
    },
  });
};

export const useDeleteProcedure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteProcedure(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });
};

export const useInstitutions = () =>
  useQuery({ queryKey: ['institutions'], queryFn: data.getInstitutions });

export const useInstitution = (id: string) =>
  useQuery({ queryKey: ['institution', id], queryFn: () => data.getInstitutionById(id), enabled: !!id });

export const useCreateInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: data.InstitutionFormInput) => data.createInstitution(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['institutions'] }),
  });
};

export const useUpdateInstitution = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ institution, input }: { institution: Institution; input: data.InstitutionFormInput }) =>
      data.updateInstitution(institution, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['institution', id] });
    },
  });
};

export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteInstitution(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['institutions'] }),
  });
};

export const useHealthFacilities = () =>
  useQuery({ queryKey: ['healthFacilities'], queryFn: data.getHealthFacilities });

export const useHealthFacilitiesByType = (type: HealthFacilityType) =>
  useQuery({
    queryKey: ['healthFacilities', type],
    queryFn: () => data.getHealthFacilitiesByType(type),
  });

export const useHealthFacility = (id: string) =>
  useQuery({ queryKey: ['healthFacility', id], queryFn: () => data.getHealthFacilityById(id), enabled: !!id });

export const usePharmaciesOnDuty = () =>
  useQuery({ queryKey: ['pharmaciesOnDuty'], queryFn: data.getPharmaciesOnDuty });

export const useCreateHealthFacility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: data.HealthFacilityFormInput) => data.createHealthFacility(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['healthFacilities'] }),
  });
};

export const useUpdateHealthFacility = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facility, input }: { facility: HealthFacility; input: data.HealthFacilityFormInput }) =>
      data.updateHealthFacility(facility, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthFacilities'] });
      queryClient.invalidateQueries({ queryKey: ['healthFacility', id] });
    },
  });
};

export const useDeleteHealthFacility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteHealthFacility(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['healthFacilities'] }),
  });
};

export const useTouristLocations = () =>
  useQuery({ queryKey: ['places'], queryFn: data.getTouristLocations });

export const useTouristLocation = (id: string) =>
  useQuery({ queryKey: ['place', id], queryFn: () => data.getTouristLocationById(id), enabled: !!id });

export const useActiveJobPostings = () =>
  useQuery({ queryKey: ['jobs'], queryFn: data.getActiveJobPostings });

export const useJob = (id: string) =>
  useQuery({ queryKey: ['job', id], queryFn: () => data.getJobById(id), enabled: !!id });

export const useEvents = () => useQuery({ queryKey: ['events'], queryFn: data.getEvents });

export const useEvent = (id: string) =>
  useQuery({ queryKey: ['event', id], queryFn: () => data.getEventById(id), enabled: !!id });

export const useItineraries = () =>
  useQuery({ queryKey: ['itineraries'], queryFn: data.getItineraries });

export const useItinerary = (id: string) =>
  useQuery({ queryKey: ['itinerary', id], queryFn: () => data.getItineraryById(id), enabled: !!id });

export const usePublishedPosts = () =>
  useQuery({ queryKey: ['posts'], queryFn: data.getPublishedPosts });

export const usePost = (id: string) =>
  useQuery({ queryKey: ['post', id], queryFn: () => data.getPostById(id), enabled: !!id });

export const useAllOffers = () => useQuery({ queryKey: ['offers'], queryFn: data.getAllOffers });

export const useOffer = (id: string) =>
  useQuery({ queryKey: ['offer', id], queryFn: () => data.getOfferById(id), enabled: !!id });

export const useAllAnnouncements = () =>
  useQuery({ queryKey: ['announcements'], queryFn: data.getAllAnnouncements });

export const useAnnouncement = (id: string) =>
  useQuery({ queryKey: ['announcement', id], queryFn: () => data.getAnnouncementById(id), enabled: !!id });

export const useServices = () => useQuery({ queryKey: ['services'], queryFn: data.getServices });

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: data.ServiceFormInput) => data.createService(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
};

export const useUpdateService = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: data.ServiceFormInput) => data.updateService(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteService(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
};

export const useSiteSettings = () =>
  useQuery({ queryKey: ['siteSettings'], queryFn: data.getSiteSettings });

export const useMenuItemsByCompany = (companyId: string) =>
  useQuery({ queryKey: ['menuItems', companyId], queryFn: () => data.getMenuItemsByCompany(companyId), enabled: !!companyId });

export const useMenuDelDiaItems = () => useQuery({ queryKey: ['menuDelDia'], queryFn: data.getMenuDelDiaItems });

export const useActiveMenuItems = () => useQuery({ queryKey: ['menuItems', 'active'], queryFn: data.getActiveMenuItems });

export const useUniqueCities = () => useQuery({ queryKey: ['cities'], queryFn: data.getUniqueCities, staleTime: 10 * 60_000 });

// Single-fetch dataset for the rule-based search engine (src/lib/search-engine.ts)
// — mirrors the web app's useSearchData, one combined query instead of per-hook
// fetches so the search screen has one loading/error state.
export const useSearchData = () => useQuery({ queryKey: ['searchIndex'], queryFn: data.getSearchIndexData });

export const useCreateFoodOrder = () => useMutation({ mutationFn: data.createFoodOrder });

export const useCreateClaim = () => useMutation({ mutationFn: data.createClaim });

export const useAddPostComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { comment: string; userId: string; authorName: string }) =>
      data.addPostComment({ postId, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', postId] }),
  });
};

export const useSuggestTouristLocation = () => useMutation({ mutationFn: data.suggestTouristLocation });

// entityType -> the singular query key used by that type's detail-screen hook
const SINGULAR_QUERY_KEY: Record<ReviewableEntityType, string> = {
  companies: 'company',
  professionals: 'professional',
  institutions: 'institution',
  procedures: 'procedure',
  itineraries: 'itinerary',
};

export const useAddReview = (entityType: ReviewableEntityType, entityId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: number; comment: string; userId: string; authorName: string }) =>
      data.addReview({ entityId, entityType, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SINGULAR_QUERY_KEY[entityType], entityId] });
    },
  });
};

// ---------- owner dashboard ----------

export const useCompaniesByOwner = (ownerId: string) =>
  useQuery({ queryKey: ['companiesByOwner', ownerId], queryFn: () => data.getCompaniesByOwner(ownerId), enabled: !!ownerId });

export const useProfessionalByOwner = (ownerId: string) =>
  useQuery({ queryKey: ['professionalByOwner', ownerId], queryFn: () => data.getProfessionalByOwner(ownerId), enabled: !!ownerId });

function useInvalidateCompany(companyId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    queryClient.invalidateQueries({ queryKey: ['companiesByOwner'] });
  };
}

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, ownerId }: { input: data.CompanyFormInput; ownerId: string }) => data.createCompany(input, ownerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companiesByOwner'] }),
  });
};

export const useUpdateCompany = (companyId: string) => {
  const invalidate = useInvalidateCompany(companyId);
  return useMutation({
    mutationFn: ({ company, input }: { company: Company; input: data.CompanyFormInput }) =>
      data.updateCompany(company, input),
    onSuccess: invalidate,
  });
};

export const useSetCompanyActive = (companyId: string) => {
  const invalidate = useInvalidateCompany(companyId);
  return useMutation({
    mutationFn: (isActive: boolean) => data.setCompanyActive(companyId, isActive),
    onSuccess: invalidate,
  });
};

export const useMenuItemMutations = (companyId: string) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['menuItems', companyId] });
  return {
    create: useMutation({
      mutationFn: ({ company, ownerId, input }: { company: Company; ownerId: string; input: data.MenuItemFormInput }) =>
        data.createMenuItem(company, ownerId, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ itemId, input }: { itemId: string; input: data.MenuItemFormInput }) => data.updateMenuItem(itemId, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (itemId: string) => data.deleteMenuItem(itemId),
      onSuccess: invalidate,
    }),
    toggleAvailable: useMutation({
      mutationFn: ({ itemId, available }: { itemId: string; available: boolean }) => data.toggleMenuItemAvailable(itemId, available),
      onSuccess: invalidate,
    }),
  };
};

export const useFoodOrdersByCompany = (companyId: string) =>
  useQuery({ queryKey: ['foodOrders', companyId], queryFn: () => data.getFoodOrdersByCompany(companyId), enabled: !!companyId });

export const useUpdateFoodOrderStatus = (companyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ order, status }: { order: FoodOrder; status: FoodOrderStatus }) =>
      data.updateFoodOrderStatus(order, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foodOrders', companyId] }),
  });
};

export const useJobPostingsByCompany = (companyId: string) =>
  useQuery({ queryKey: ['jobPostingsByCompany', companyId], queryFn: () => data.getJobPostingsByCompany(companyId), enabled: !!companyId });

export const useJobPostingMutations = (companyId: string) => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['jobPostingsByCompany', companyId] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };
  return {
    create: useMutation({
      mutationFn: ({ company, ownerId, input }: { company: Company; ownerId: string; input: data.JobPostingFormInput }) =>
        data.createJobPosting(company, ownerId, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ jobId, input }: { jobId: string; input: data.JobPostingFormInput }) => data.updateJobPosting(jobId, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (jobId: string) => data.deleteJobPosting(jobId),
      onSuccess: invalidate,
    }),
    toggleStatus: useMutation({
      mutationFn: ({ jobId, status }: { jobId: string; status: 'open' | 'closed' }) => data.toggleJobStatus(jobId, status),
      onSuccess: invalidate,
    }),
  };
};

export const useEventsByCompany = (companyId: string) =>
  useQuery({ queryKey: ['eventsByCompany', companyId], queryFn: () => data.getEventsByCompany(companyId), enabled: !!companyId });

export const useCompanyEventMutations = (companyId: string) => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['eventsByCompany', companyId] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };
  return {
    create: useMutation({
      mutationFn: ({ company, input }: { company: Company; input: data.EventFormInput }) =>
        data.createEvent(company, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (eventId: string) => data.deleteEvent(eventId), onSuccess: invalidate }),
    toggleStatus: useMutation({
      mutationFn: ({ eventId, status }: { eventId: string; status: 'scheduled' | 'cancelled' }) => data.toggleEventStatus(eventId, status),
      onSuccess: invalidate,
    }),
  };
};

export const useCompanyOfferMutations = (companyId: string) => {
  const invalidate = useInvalidateCompany(companyId);
  return {
    add: useMutation({
      mutationFn: ({ company, input }: { company: Company; input: Parameters<typeof data.addOffer>[1] }) =>
        data.addOffer(company, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: ({ company, offer }: { company: Company; offer: Offer }) =>
        data.deleteOffer(company, offer),
      onSuccess: invalidate,
    }),
  };
};

export const useCompanyAnnouncementMutations = (companyId: string) => {
  const invalidate = useInvalidateCompany(companyId);
  return {
    add: useMutation({
      mutationFn: ({ company, input }: { company: Company; input: Parameters<typeof data.addAnnouncement>[1] }) =>
        data.addAnnouncement(company, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: ({ company, announcement }: { company: Company; announcement: Announcement }) =>
        data.deleteAnnouncement(company, announcement),
      onSuccess: invalidate,
    }),
  };
};

// ---------- admin ----------

export const usePendingClaims = () => useQuery({ queryKey: ['pendingClaims'], queryFn: data.getPendingClaims });

export const useProcessClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ claim, approve }: { claim: Claim; approve: boolean }) => data.processClaim(claim, approve),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingClaims'] }),
  });
};

export const usePendingPlaces = () => useQuery({ queryKey: ['pendingPlaces'], queryFn: data.getPendingPlaces });

export const useReviewTouristLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, decision }: { locationId: string; decision: 'approved' | 'rejected' }) =>
      data.reviewTouristLocation(locationId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingPlaces'] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
};

export const useAllUsers = () => useQuery({ queryKey: ['allUsers'], queryFn: data.getAllUsers });

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: NonNullable<AppUser['role']> }) => data.updateUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allUsers'] }),
  });
};

export const useToggleUserPremium = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, currentStatus }: { userId: string; currentStatus: boolean }) => data.toggleUserPremium(userId, currentStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allUsers'] }),
  });
};
