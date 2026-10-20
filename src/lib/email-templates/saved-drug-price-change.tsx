import { Html, Head, Preview, Body, Container, Heading, Text, Button } from '@react-email/components';
import type { TemplateEntry } from './registry';

interface Props { drugName?:string; ndc?:string; pricingUnit?:string; pharmacyType?:string; previousDate?:string; currentDate?:string; oldPrice?:string; newPrice?:string; }
function SavedDrugPriceChange(p:Props) {
 return <Html lang="en"><Head/><Preview>NADAC change for {p.drugName ?? 'your saved drug'}</Preview><Body style={body}><Container style={container}>
  <Heading>NADAC Lookup</Heading><Text>A CMS NADAC unit-price change was verified for your saved drug.</Text>
  <Heading as="h2">{p.drugName ?? 'Saved drug'}</Heading><Text>NDC: {p.ndc ?? 'Not available'}<br/>Pricing unit: {p.pricingUnit ?? 'Not available'}<br/>Pharmacy type: {p.pharmacyType ?? 'Not available'}</Text>
  <Text>CMS release {p.previousDate ?? 'Not available'}: ${p.oldPrice ?? 'Not available'} per {p.pricingUnit ?? 'unit'}<br/>CMS release {p.currentDate ?? 'Not available'}: ${p.newPrice ?? 'Not available'} per {p.pricingUnit ?? 'unit'}</Text>
  <Text>NADAC is a published benchmark, not your actual acquisition cost or PBM reimbursement.</Text>
  <Button href="https://nadaclookup.com/saved-drugs" style={button}>View watchlist</Button>
 </Container></Body></Html>;
}
export const template = {component:SavedDrugPriceChange,subject:'Verified NADAC change for a saved drug',displayName:'Saved-drug price change'} satisfies TemplateEntry;
const body={backgroundColor:'#ffffff',fontFamily:'Arial, sans-serif',color:'hsl(220, 20%, 14%)'};
const container={padding:'28px',maxWidth:'560px'};
const button={backgroundColor:'hsl(215, 90%, 42%)',color:'#ffffff',padding:'12px 18px',borderRadius:'6px'};