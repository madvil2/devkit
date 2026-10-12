import type { NextRequest } from 'next/server'
import { proxyToUpstream } from '@/shared/api/bff.server'

type ProxyRouteContext = {
  params: Promise<{ path: string[] }>
}

const handle = async (request: NextRequest, { params }: ProxyRouteContext) =>
  proxyToUpstream(request, (await params).path)

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
