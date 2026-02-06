import { supabase } from "@/integrations/supabase/client";
import { DrugData } from "@/components/DrugCard";

export interface SearchResponse {
  success: boolean;
  data?: DrugData[];
  total?: number;
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  totalRecords?: number;
  error?: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  pricingUnit: string;
}

export interface PriceHistoryStats {
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  percentChange: number;
  dataPoints: number;
}

export interface PriceHistoryResponse {
  success: boolean;
  ndc?: string;
  history: PriceHistoryPoint[];
  stats: PriceHistoryStats;
  error?: string;
}

export const nadacApi = {
  async search(searchTerm: string, limit = 50): Promise<SearchResponse> {
    const { data, error } = await supabase.functions.invoke('search-nadac', {
      body: { searchTerm, limit },
    });

    if (error) {
      console.error('Search error:', error);
      return { success: false, error: error.message };
    }

    // Transform the response to match our DrugData interface
    const drugs: DrugData[] = (data?.data || []).map((drug: any) => ({
      ndc: drug.ndc,
      drugName: drug.drug_name,
      nadacPerUnit: parseFloat(drug.nadac_per_unit),
      effectiveDate: drug.effective_date,
      pricingUnit: drug.pricing_unit,
      pharmacyType: drug.pharmacy_type,
      explanation: drug.explanation,
    }));

    return {
      success: true,
      data: drugs,
      total: data?.total || drugs.length,
    };
  },

  async syncData(): Promise<SyncResponse> {
    const { data, error } = await supabase.functions.invoke('sync-nadac', {
      body: {},
    });

    if (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }

    return data as SyncResponse;
  },

  async getDataStatus(): Promise<{ hasData: boolean; lastUpdate: string | undefined; totalRecords: number }> {
    const { count, error } = await supabase
      .from('nadac_drugs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Status check error:', error);
      return { hasData: false, totalRecords: 0, lastUpdate: undefined };
    }

    if (count && count > 0) {
      const { data: latestRecord } = await supabase
        .from('nadac_drugs')
        .select('effective_date')
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      return {
        hasData: true,
        lastUpdate: latestRecord?.effective_date,
        totalRecords: count,
      };
    }

    return { hasData: false, totalRecords: 0, lastUpdate: undefined };
  },

  async getSuggestions(searchTerm: string, limit = 10): Promise<string[]> {
    if (!searchTerm || searchTerm.length < 2) return [];

    const { data, error } = await supabase
      .from('nadac_drugs')
      .select('drug_name')
      .ilike('drug_name', `%${searchTerm}%`)
      .limit(100);

    if (error || !data) return [];

    // Get unique drug names (first part before specific details)
    const uniqueNames = new Map<string, number>();
    
    data.forEach(drug => {
      const name = drug.drug_name;
      // Prioritize exact prefix matches
      const isExactPrefix = name.toUpperCase().startsWith(searchTerm.toUpperCase());
      const score = isExactPrefix ? 100 : 0;
      
      if (!uniqueNames.has(name) || uniqueNames.get(name)! < score) {
        uniqueNames.set(name, score);
      }
    });

    // Sort by score (exact matches first) then alphabetically
    return Array.from(uniqueNames.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .slice(0, limit)
      .map(([name]) => name);
  },

  async getPriceHistory(ndc: string, years: number = 2): Promise<PriceHistoryResponse> {
    const { data, error } = await supabase.functions.invoke('get-price-history', {
      body: { ndc, years },
    });

    if (error) {
      console.error('Price history error:', error);
      return { 
        success: false, 
        error: error.message,
        history: [],
        stats: { currentPrice: 0, highestPrice: 0, lowestPrice: 0, percentChange: 0, dataPoints: 0 }
      };
    }

    return {
      success: data?.success ?? false,
      ndc: data?.ndc,
      history: data?.history || [],
      stats: data?.stats || { currentPrice: 0, highestPrice: 0, lowestPrice: 0, percentChange: 0, dataPoints: 0 },
      error: data?.error,
    };
  },
};
