import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WebsiteConfig, ChatbotConfig, BusinessHours, SocialMedia } from '@/types/settings';

interface SettingsState {
  websiteConfig: WebsiteConfig | null;
  chatbotConfig: ChatbotConfig | null;
  businessHours: BusinessHours | null;
  socialMedia: SocialMedia | null;
  agencyInfo: { company_name: string; subdomain: string; phone: string; email: string; address: string } | null;
  businessTypeSlug: string | null;
  isLoaded: boolean;
  
  setWebsiteConfig: (config: WebsiteConfig) => void;
  setChatbotConfig: (config: ChatbotConfig) => void;
  setBusinessHours: (hours: BusinessHours) => void;
  setSocialMedia: (social: SocialMedia) => void;
  setAgencyInfo: (info: any) => void;
  setAllSettings: (data: {
    website_config?: any;
    chatbot_config?: any;
    business_hours?: any;
    social_media?: any;
    company_name?: string;
    subdomain?: string;
    phone?: string;
    email?: string;
    address?: string;
    business_type_slug?: string;
  }) => void;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      websiteConfig: null,
      chatbotConfig: null,
      businessHours: null,
      socialMedia: null,
      agencyInfo: null,
      businessTypeSlug: null,
      isLoaded: false,

      setWebsiteConfig: (config) => set({ websiteConfig: config }),
      setChatbotConfig: (config) => set({ chatbotConfig: config }),
      setBusinessHours: (hours) => set({ businessHours: hours }),
      setSocialMedia: (social) => set({ socialMedia: social }),
      setAgencyInfo: (info) => set({ agencyInfo: info }),
      
      setAllSettings: (data) => set((state) => ({
        websiteConfig: data.website_config || state.websiteConfig,
        chatbotConfig: data.chatbot_config || state.chatbotConfig,
        businessHours: data.business_hours || state.businessHours,
        socialMedia: data.social_media || state.socialMedia,
        businessTypeSlug: data.business_type_slug || state.businessTypeSlug || 'travel',
        agencyInfo: {
          company_name: data.company_name || state.agencyInfo?.company_name || '',
          subdomain: data.subdomain || state.agencyInfo?.subdomain || '',
          phone: data.phone || state.agencyInfo?.phone || '',
          email: data.email || state.agencyInfo?.email || '',
          address: data.address || state.agencyInfo?.address || '',
        },
        isLoaded: true
      })),

      clearSettings: () => set({
        websiteConfig: null,
        chatbotConfig: null,
        businessHours: null,
        socialMedia: null,
        agencyInfo: null,
        businessTypeSlug: null,
        isLoaded: false
      }),
    }),
    {
      name: 'agency-settings-storage',
      partialize: (state) => ({
        websiteConfig: state.websiteConfig,
        chatbotConfig: state.chatbotConfig,
        businessHours: state.businessHours,
        socialMedia: state.socialMedia,
        agencyInfo: state.agencyInfo,
        businessTypeSlug: state.businessTypeSlug
      }),
    }
  )
);
