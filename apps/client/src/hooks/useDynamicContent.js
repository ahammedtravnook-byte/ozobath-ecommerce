// ============================================
// OZOBATH - useDynamicContent Hook
// Fetches page content from CMS and caches it
// ============================================
import { useState, useEffect } from 'react';
import { contentAPI, bannerAPI, testimonialAPI, faqAPI } from '@api/services';

// Custom hook to fetch dynamic page content
export const useDynamicContent = (page) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await contentAPI.getPageContent(page);
        if (isMounted) setContent(res.data || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContent();
    return () => { isMounted = false; };
  }, [page]);

  // Helper to get section by key
  const getSection = (sectionKey) => content.find((c) => c.section === sectionKey);
  const getSections = (sectionKey) => content.filter((c) => c.section === sectionKey);

  return { content, loading, error, getSection, getSections };
};

// Hook to fetch banners for a page
export const useBanners = (page, position) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await bannerAPI.get({ page, position });
        setBanners(res.data || []);
      } catch (e) {
        console.error('Banner fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [page, position]);

  return { banners, loading };
};

// Hook for testimonials
export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testimonialAPI.getAll()
      .then((res) => setTestimonials(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { testimonials, loading };
};

// Hook for FAQs
export const useFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    faqAPI.getAll()
      .then((res) => setFaqs(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { faqs, loading };
};
