// Global Search API Route
// Supports searching across: customers, contacts, opportunities, leads, quotes, orders, contracts, products

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface SearchResult {
  id: string;
  type: 'customer' | 'contact' | 'opportunity' | 'lead' | 'quote' | 'order' | 'contract' | 'product';
  title: string;
  subtitle: string;
  url: string;
}

// Limit results per category
const MAX_RESULTS_PER_TYPE = 3;

// Search configuration
const SEARCH_CONFIG = {
  minQueryLength: 1,
  maxQueryLength: 100,
} as const;

// Generate URL for each entity type
function getEntityUrl(type: SearchResult['type'], id: string): string {
  const urlMap: Record<SearchResult['type'], string> = {
    customer: `/customers/${id}`,
    contact: `/contacts/${id}`,
    opportunity: `/opportunities/${id}`,
    lead: `/leads/${id}`,
    quote: `/quotes/${id}`,
    order: `/orders/${id}`,
    contract: `/contracts/${id}`,
    product: `/products/${id}`,
  };
  return urlMap[type];
}

// Search customers
async function searchCustomers(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('customers')
    .select('id, name, email, company')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'customer' as const,
    title: item.name,
    subtitle: item.company || item.email,
    url: getEntityUrl('customer', item.id),
  }));
}

// Search contacts
async function searchContacts(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('contacts')
    .select('id, first_name, last_name, email, phone, customer_name')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'contact' as const,
    title: `${item.first_name} ${item.last_name}`.trim(),
    subtitle: item.customer_name || item.email,
    url: getEntityUrl('contact', item.id),
  }));
}

// Search opportunities
async function searchOpportunities(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('opportunities')
    .select('id, title, customer_name, value')
    .or(`title.ilike.%${query}%,customer_name.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'opportunity' as const,
    title: item.title,
    subtitle: `${item.customer_name} · ¥${item.value?.toLocaleString() || 0}`,
    url: getEntityUrl('opportunity', item.id),
  }));
}

// Search leads
async function searchLeads(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('leads')
    .select('id, title, customer_name, estimated_value')
    .or(`title.ilike.%${query}%,customer_name.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'lead' as const,
    title: item.title,
    subtitle: `${item.customer_name} · ¥${item.estimated_value?.toLocaleString() || 0}`,
    url: getEntityUrl('lead', item.id),
  }));
}

// Search quotes
async function searchQuotes(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('quotes')
    .select('id, quote_number, title, customer_name, total_amount')
    .or(`quote_number.ilike.%${query}%,title.ilike.%${query}%,customer_name.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'quote' as const,
    title: item.title || item.quote_number,
    subtitle: `${item.customer_name} · ¥${item.total_amount?.toLocaleString() || 0}`,
    url: getEntityUrl('quote', item.id),
  }));
}

// Search orders
async function searchOrders(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('orders')
    .select('id, order_number, title, customer_name, total_amount')
    .or(`order_number.ilike.%${query}%,title.ilike.%${query}%,customer_name.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'order' as const,
    title: item.title || item.order_number,
    subtitle: `${item.customer_name} · ¥${item.total_amount?.toLocaleString() || 0}`,
    url: getEntityUrl('order', item.id),
  }));
}

// Search contracts
async function searchContracts(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('contracts')
    .select('id, contract_number, title, customer_name, total_amount')
    .or(`contract_number.ilike.%${query}%,title.ilike.%${query}%,customer_name.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'contract' as const,
    title: item.title || item.contract_number,
    subtitle: `${item.customer_name} · ¥${item.total_amount?.toLocaleString() || 0}`,
    url: getEntityUrl('contract', item.id),
  }));
}

// Search products
async function searchProducts(client: ReturnType<typeof getSupabaseClient>, query: string): Promise<SearchResult[]> {
  const { data, error } = await client
    .from('products')
    .select('id, name, sku, unit_price')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    type: 'product' as const,
    title: item.name,
    subtitle: `${item.sku} · ¥${item.unit_price?.toLocaleString() || 0}`,
    url: getEntityUrl('product', item.id),
  }));
}

// Main GET handler
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();

    // Validate query
    if (!query) {
      return NextResponse.json({ results: [], total: 0 });
    }

    if (query.length < SEARCH_CONFIG.minQueryLength || query.length > SEARCH_CONFIG.maxQueryLength) {
      return NextResponse.json({ 
        error: `Query must be between ${SEARCH_CONFIG.minQueryLength} and ${SEARCH_CONFIG.maxQueryLength} characters` 
      }, { status: 400 });
    }

    const client = getSupabaseClient();

    // Execute all searches in parallel
    const [
      customers,
      contacts,
      opportunities,
      leads,
      quotes,
      orders,
      contracts,
      products,
    ] = await Promise.all([
      searchCustomers(client, query),
      searchContacts(client, query),
      searchOpportunities(client, query),
      searchLeads(client, query),
      searchQuotes(client, query),
      searchOrders(client, query),
      searchContracts(client, query),
      searchProducts(client, query),
    ]);

    // Group results by type
    const results: SearchResult[] = [
      ...customers,
      ...contacts,
      ...opportunities,
      ...leads,
      ...quotes,
      ...orders,
      ...contracts,
      ...products,
    ];

    return NextResponse.json({
      results,
      total: results.length,
      query,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}
