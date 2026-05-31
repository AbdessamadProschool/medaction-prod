import useSWR, { SWRConfiguration } from 'swr';

/**
 * Fetcher global pour SWR avec gestion d'erreurs standardisée
 * Adapté pour le format de réponse de l'API (successResponse)
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    // Tenter de parser l'erreur de notre withErrorHandler
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || errorData?.message || 'Une erreur est survenue lors du chargement des données.';
    
    const error = new Error(errorMessage);
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }
  
  const data = await res.json();
  
  // Retourner l'objet complet pour que les composants puissent accéder à .data, .stats, .pagination, etc.
  // La plupart des composants utilisent data?.data ou data?.data?.stats
  return data;
};

/**
 * Hook de fetching de données standardisé selon les normes ECC.
 * Remplace les fetch() dans les useEffect.
 * 
 * @param url L'URL de l'API, ou null pour désactiver le fetch
 * @param config Configuration SWR optionnelle
 */
export function useData<T = any>(url: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate, isValidating } = useSWR<T>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false, // Évite les requêtes en boucle sur 404
      ...config,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    isValidating
  };
}
