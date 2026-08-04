"use client";

import { useQuery } from "@tanstack/react-query";

import { getKatalogExtra, getKatalogJual } from "@/clients/katalog";
import {
  KATALOG_EXTRA_KEY,
  KATALOG_JUAL_KEY,
} from "@/constants/cashier-constant";

export function useKatalogJual() {
  return useQuery({ queryKey: KATALOG_JUAL_KEY, queryFn: getKatalogJual });
}

export function useKatalogExtra() {
  return useQuery({ queryKey: KATALOG_EXTRA_KEY, queryFn: getKatalogExtra });
}
