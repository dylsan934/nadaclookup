import { queryOptions } from '@tanstack/react-query';
import { getWeeklyPublication } from './weekly-publication.functions';
export const weeklyPublicationQuery = queryOptions({queryKey:['weekly-publication'],queryFn:()=>getWeeklyPublication(),staleTime:0,refetchOnWindowFocus:true});
