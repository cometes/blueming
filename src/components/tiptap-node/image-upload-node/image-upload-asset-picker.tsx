"use client"

import * as React from "react"
import AssetGrid from "@/components/asset/AssetGrid"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStickerBoardAssets } from "@/features/stickerboard-editor/hooks/useStickerBoardAssets"
import type {
  StickerAsset,
  StickerAssetTab,
} from "@/features/stickerboard-editor/model"

interface ImageUploadAssetPickerProps {
  onSelect: (asset: StickerAsset) => void
}

/** 업로드 노드의 "에셋에서 가져오기" 팝오버 (스티커 에셋 재사용) */
export function ImageUploadAssetPicker({
  onSelect,
}: ImageUploadAssetPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div
      className="mt-3 flex justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={(e) => e.stopPropagation()}
          >
            에셋에서 가져오기
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[360px] p-3 bg-card border-card rounded-card backdrop-blur-card text-main-text"
          side="bottom"
          align="center"
        >
          <AssetPickerContent
            onSelect={(asset) => {
              onSelect(asset)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** 팝오버가 열릴 때 마운트되어 그때 목록을 불러온다 (lazy 로딩 유지).
    useStickerBoardAssets를 재사용하므로 에셋 추가/삭제 이벤트 자동 갱신도 함께 적용됨. */
function AssetPickerContent({
  onSelect,
}: {
  onSelect: (asset: StickerAsset) => void
}) {
  const {
    state: { assetTab, assets, assetsLoading, assetsError },
    actions: { setAssetTab, markAssetUsed },
  } = useStickerBoardAssets("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <>
      <div className="text-xs font-semibold text-main-text mb-2">
        이미지 에셋
      </div>
      <Tabs
        value={assetTab}
        onValueChange={(value) => setAssetTab(value as StickerAssetTab)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1 text-xs">
            전체
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1 text-xs">
            즐겨찾기
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex-1 text-xs">
            최근
          </TabsTrigger>
        </TabsList>
        {(["all", "favorites", "recent"] as StickerAssetTab[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-3">
            <AssetGrid
              assets={assets}
              loading={assetsLoading}
              error={assetsError}
              selectedUrl={undefined}
              onSelect={(asset) => {
                onSelect(asset)
                void markAssetUsed(asset.id).catch(() => {})
              }}
              enableSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              gridTemplateColumns="repeat(3, minmax(0, 1fr))"
              aspectClassName="aspect-square"
              imageClassName="h-full w-full object-cover"
              className="max-h-[220px]"
            />
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}
