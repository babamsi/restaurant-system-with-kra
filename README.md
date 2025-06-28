# Maamul

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/babamsis-projects/maamul-page)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/6kySa3Wkder)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/babamsis-projects/maamul-page](https://vercel.com/babamsis-projects/maamul-page)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/6kySa3Wkder](https://v0.dev/chat/projects/6kySa3Wkder)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

# Kitchen Inventory Deduction Logic

## Partial Pack Handling and Deduction

When an ingredient is stored as a countable unit (e.g., 'Olive 4 LTR' as pieces/packs), but a batch requests a weight/volume (e.g., grams or ml), the system:

1. **Deducts from the open pack first** (tracked in `open_container_remaining` in `kitchen_storage`).
2. **If not enough in the open pack**, opens new packs as needed, decrementing `quantity` and updating `open_container_remaining` to the remainder in the last opened pack.
3. **If not enough packs are available**, the system blocks the operation and shows an error.

## Database Schema Improvements

### `kitchen_storage`
- `quantity`: Number of packs/pieces in storage.
- `unit`: Storage unit (e.g., 'piece', 'pack', 'kg', 'l').
- `open_container_remaining`: How much is left in the open pack (in base units, e.g., grams or ml).
- `open_container_unit`: The unit for the open container (e.g., 'g', 'ml').
- `used_grams`, `used_liters`: Track usage for reporting.

### `usage_events` (NEW)
- Records every deduction event for traceability.
- Fields: `ingredient_id`, `batch_id`, `amount_used`, `unit`, `source`, `timestamp`, `notes`.

## Example

If you have 3 packs of 'Olive 4 LTR' (each pack = 4000ml), and a batch requests 120g (ml) of olive oil:
- The system deducts from the open pack first.
- If the open pack is empty, it opens a new pack, decrements `quantity`, and sets `open_container_remaining` to (4000 - 120).
- All deductions are logged in `usage_events` for audit.