/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'NADAC Lookup'
const SITE_URL = 'https://nadaclookup.com'

interface Mover {
  ndc: string
  drugName: string
  oldPrice: number
  newPrice: number
  pctChange: number
  pricingUnit: string
}

interface DigestProps {
  weekLabel?: string
  previousLabel?: string
  totalChanged?: number
  topIncreases?: Mover[]
  topDecreases?: Mover[]
}

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
  }).format(n)

const MoverList = ({ movers, kind }: { movers: Mover[]; kind: 'up' | 'down' }) => (
  <Section>
    {movers.map((m, i) => (
      <Section key={m.ndc} style={row}>
        <Text style={rowText}>
          <strong style={{ color: '#0d2b6b' }}>{i + 1}.</strong>{' '}
          <strong>{m.drugName}</strong>
          <br />
          <span style={meta}>
            {fmtPrice(m.oldPrice)} → {fmtPrice(m.newPrice)} / {m.pricingUnit}
          </span>{' '}
          <span style={kind === 'up' ? badgeUp : badgeDown}>
            {m.pctChange > 0 ? '+' : ''}
            {m.pctChange}%
          </span>
        </Text>
      </Section>
    ))}
  </Section>
)

const WeeklyMoversDigestEmail = ({
  weekLabel = 'this week',
  previousLabel = '',
  totalChanged = 0,
  topIncreases = [],
  topDecreases = [],
}: DigestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>This week's biggest NADAC price movers — top 10 up and down</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Weekly NADAC Price Movers</Heading>
        <Text style={subhead}>
          Week of {weekLabel}
          {previousLabel ? ` (vs ${previousLabel})` : ''} · {totalChanged.toLocaleString()} drugs changed
        </Text>

        <Heading style={h2}>📈 Top {topIncreases.length} Increases</Heading>
        <MoverList movers={topIncreases} kind="up" />

        <Hr style={hr} />

        <Heading style={h2}>📉 Top {topDecreases.length} Decreases</Heading>
        <MoverList movers={topDecreases} kind="down" />

        <Section style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button style={button} href={`${SITE_URL}/movers`}>
            View on {SITE_NAME}
          </Button>
        </Section>

        <Text style={footer}>
          You're receiving this because you're a {SITE_NAME} Pro subscriber. NADAC data is published
          weekly by CMS.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WeeklyMoversDigestEmail,
  subject: (data: Record<string, any>) =>
    `Weekly NADAC movers — week of ${data?.weekLabel ?? 'this week'}`,
  displayName: 'Weekly Movers Digest (Pro)',
  previewData: {
    weekLabel: 'May 13, 2026',
    previousLabel: 'May 6, 2026',
    totalChanged: 1842,
    topIncreases: [
      { ndc: '00001', drugName: 'EXAMPLE DRUG 10MG', oldPrice: 0.1234, newPrice: 0.5678, pctChange: 360.13, pricingUnit: 'EA' },
    ],
    topDecreases: [
      { ndc: '00002', drugName: 'ANOTHER DRUG 5MG', oldPrice: 0.99, newPrice: 0.12, pctChange: -87.88, pricingUnit: 'ML' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '640px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0d2b6b', margin: '0 0 6px' }
const h2 = { fontSize: '16px', fontWeight: 600, color: '#0d2b6b', margin: '24px 0 8px' }
const subhead = { fontSize: '13px', color: '#6b7280', margin: '0 0 8px' }
const row = { padding: '8px 0', borderBottom: '1px solid #eef0f4' }
const rowText = { fontSize: '14px', color: '#1f2937', margin: 0, lineHeight: '1.5' }
const meta = { fontSize: '12px', color: '#6b7280' }
const badgeUp = {
  display: 'inline-block',
  marginLeft: '6px',
  padding: '1px 8px',
  borderRadius: '999px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  fontSize: '12px',
  fontWeight: 600,
}
const badgeDown = {
  display: 'inline-block',
  marginLeft: '6px',
  padding: '1px 8px',
  borderRadius: '999px',
  backgroundColor: '#ecfdf5',
  color: '#047857',
  fontSize: '12px',
  fontWeight: 600,
}
const hr = { border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }
const button = {
  backgroundColor: 'hsl(215, 90%, 42%)',
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '28px', lineHeight: '1.5' }
