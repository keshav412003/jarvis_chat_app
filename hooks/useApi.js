"use client";

import { useState, useCallback } from 'react';
import { useToast } from '@/components/providers/ToastProvider';

export function useApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { addToast } = useToast();

    const request = useCallback(async (url, options = {}) => {
        setLoading(true);
        setError(null);

        const { retry = 0, initialRetry = 0, ...fetchOptions } = options;

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers: {
                    'Content-Type': 'application/json',
                    ...fetchOptions.headers,
                },
            });

            // Handle non-JSON responses gracefully
            const contentType = response.headers.get("content-type");
            let data = {};
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            if (!response.ok) {
                // Global Auth Handling
                if (response.status === 401 || response.status === 403) {
                    addToast({
                        title: 'Session Expired',
                        description: 'Please login again to continue.',
                        type: 'warning',
                    });
                    // Force refresh to trigger middleware redirect if on a protected page
                    if (typeof window !== 'undefined') {
                        window.location.href = '/';
                    }
                    return { data: null, error: 'Unauthorized' };
                }

                const errorMessage = data.message || data.error || 'Something went wrong';
                setError(errorMessage);
                addToast({
                    title: 'Error',
                    description: errorMessage,
                    type: 'error',
                });
                return { data: null, error: errorMessage };
            }

            return { data, error: null };
        } catch (err) {
            // Silently ignore aborted requests (happens on component unmount)
            if (err.name === 'AbortError') {
                return { data: null, error: 'Request aborted' };
            }

            // Retry logic for network errors
            if (retry > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return request(url, { ...options, retry: retry - 1 });
            }

            const errorMessage = err.message || 'Network error';
            setError(errorMessage);
            addToast({
                title: 'Connection Error',
                description: 'Please check your internet connection.',
                type: 'error',
            });
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    return { request, loading, error };
}
