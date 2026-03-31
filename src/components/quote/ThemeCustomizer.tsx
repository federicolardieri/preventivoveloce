"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function ThemeCustomizer() {
  const { currentQuote, updateTheme } = useQuoteStore();

  if (!currentQuote) return null;

  return (
    <Card className="shadow-sm border-slate-200 mt-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Colore Primario</Label>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-12 h-12 p-1 rounded-md border-2"
                    style={{ backgroundColor: currentQuote.theme.primaryColor, borderColor: currentQuote.theme.primaryColor }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker 
                    color={currentQuote.theme.primaryColor} 
                    onChange={(hex) => updateTheme({ primaryColor: hex })} 
                  />
                </PopoverContent>
              </Popover>
              <Input 
                value={currentQuote.theme.primaryColor.toUpperCase()} 
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="w-28 font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Colore Secondario (Accento)</Label>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-12 h-12 p-1 rounded-md border-2"
                    style={{ backgroundColor: currentQuote.theme.accentColor, borderColor: currentQuote.theme.accentColor }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker 
                    color={currentQuote.theme.accentColor} 
                    onChange={(hex) => updateTheme({ accentColor: hex })} 
                  />
                </PopoverContent>
              </Popover>
              <Input 
                value={currentQuote.theme.accentColor.toUpperCase()} 
                onChange={(e) => updateTheme({ accentColor: e.target.value })}
                className="w-28 font-mono"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
