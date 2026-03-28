/**
 * AppStyles — single shared stylesheet for the entire app.
 *
 * Theme-dependent colours (tint, text, background) are applied inline
 * via useThemeColor() in each component; only static layout and sizing
 * live here so the file stays pure and importable outside React.
 *
 * Design tokens (sourced from login.tsx as the reference design):
 *   Button height  : 48
 *   Border radius  : 8 (inputs / buttons)  12 (cards)
 *   Primary font   : system – semibold 600
 */

import { StyleSheet } from 'react-native';
import { Fonts } from './theme';

export const AppStyles = StyleSheet.create({
  // ── Layout primitives ───────────────────────────────────────────────
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap8: { gap: 8 },
  gap10: { gap: 10 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },

  // ── Screen / form wrapper ───────────────────────────────────────────
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Typography ──────────────────────────────────────────────────────
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts?.rounded ?? 'normal',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    opacity: 0.45,
  },
  monoText: {
    fontFamily: Fonts?.mono ?? 'monospace',
  },

  // ── Text input ──────────────────────────────────────────────────────
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },

  // ── Primary filled button ───────────────────────────────────────────
  primaryButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Ghost / outline button ──────────────────────────────────────────
  ghostButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Text link button ────────────────────────────────────────────────
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Small icon/label button (e.g. Refresh, Clear) ───────────────────
  iconButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  iconButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Card ────────────────────────────────────────────────────────────
  card: {
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSubtext: {
    fontSize: 13,
    opacity: 0.55,
    lineHeight: 18,
  },

  // ── Pill / status badge ─────────────────────────────────────────────
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Segment / tab control ───────────────────────────────────────────
  segmentBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts?.rounded ?? 'normal',
  },

  // ── Divider ─────────────────────────────────────────────────────────
  divider: {
    height: StyleSheet.hairlineWidth,
  },

  // ── Status indicator dot ─────────────────────────────────────────────
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  // ── List row ────────────────────────────────────────────────────────
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // ── Empty state ──────────────────────────────────────────────────────
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.4,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Auth switch row ──────────────────────────────────────────────────
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
  },
});
