import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VoiceEffectSelectorProps {
  selectedEffect: string
  onEffectChange: (effect: string) => void
}

export default function VoiceEffectSelector({ selectedEffect, onEffectChange }: VoiceEffectSelectorProps) {
  return (
    <div className="mb-4">
      <Select value={selectedEffect} onValueChange={onEffectChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select voice effect" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="child">Child</SelectItem>
          <SelectItem value="old">Old Age</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

