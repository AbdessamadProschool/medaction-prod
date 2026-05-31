import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';

/**
 * Type pour définir la méthode HTTP de la mutation
 */
export type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Fetcher générique pour les mutations
 */
async function mutationFetcher<TData, TArgs = any>(
  url: string,
  { arg }: { arg: { method: MutationMethod; data?: TArgs; headers?: Record<string, string> } }
): Promise<TData> {
  const { method, data, headers = {} } = arg;
  
  // Construction des options de la requête
  const options: RequestInit = {
    method,
    headers: {
      ...headers,
    },
  };

  // Ajout du body si des données sont fournies (sauf pour DELETE qui n'a généralement pas de body, mais parfois oui)
  if (data !== undefined) {
    // Si c'est un FormData (pour upload de fichiers), ne pas définir de Content-Type
    // Le navigateur va le faire automatiquement avec le bon boundary
    if (data instanceof FormData) {
      options.body = data;
    } else {
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      options.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || errorData?.message || 'Une erreur est survenue lors de l\'opération.';
    
    const error = new Error(errorMessage);
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }

  // Certains DELETE ou réponses peuvent ne pas avoir de contenu
  if (res.status === 204) {
    return {} as TData;
  }

  const resultData = await res.json().catch(() => ({}));
  // Gestion du format standard de l'API (successResponse)
  return resultData.data !== undefined ? resultData.data : resultData;
}

/**
 * Hook standardisé ECC pour effectuer des mutations (POST, PUT, DELETE, PATCH).
 * S'intègre avec SWR pour invalider facilement le cache si nécessaire.
 * 
 * @param url L'URL cible de l'API
 * @param config Configuration SWRMutation optionnelle
 */
export function useMutation<TData = any, TArgs = any>(
  url?: string | null,
  config?: SWRMutationConfiguration<TData, Error, string, { method: MutationMethod; data?: TArgs; headers?: Record<string, string> }>
) {
  const { trigger, data, error, isMutating, reset } = useSWRMutation<
    TData,
    Error,
    string,
    { method: MutationMethod; data?: TArgs; headers?: Record<string, string> }
  >(url || 'dynamic-mutation', mutationFetcher, config);

  /**
   * Helper pour envoyer une requête POST
   */
  const post = (data?: TArgs, headers?: Record<string, string>) => {
    return trigger({ method: 'POST', data, headers });
  };

  /**
   * Helper pour envoyer une requête PUT
   */
  const put = (data?: TArgs, headers?: Record<string, string>) => {
    return trigger({ method: 'PUT', data, headers });
  };
  
  /**
   * Helper pour envoyer une requête PATCH
   */
  const patch = (data?: TArgs, headers?: Record<string, string>) => {
    return trigger({ method: 'PATCH', data, headers });
  };

  /**
   * Helper pour envoyer une requête DELETE
   */
  const del = (data?: TArgs, headers?: Record<string, string>) => {
    return trigger({ method: 'DELETE', data, headers });
  };

  /**
   * Helper dynamique pour envoyer une requête vers une URL spécifique
   */
  const mutate = (overrideUrl: string, options: { method: MutationMethod; data?: TArgs; headers?: Record<string, string> }) => {
    return mutationFetcher<TData, TArgs>(overrideUrl, { arg: options });
  };

  return {
    post,
    put,
    patch,
    del,
    mutate,
    trigger,
    data,
    error,
    isMutating,
    isLoading: isMutating,
    isError: !!error,
    reset,
  };
}
