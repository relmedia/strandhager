"use client";

import { Bar, BarChart, CartesianGrid, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const chartConfig = {
  visitors: {
    color: "var(--chart-1)",
    label: "Besøkende",
  },
} satisfies ChartConfig;

export type TrafficSourceDatum = {
  label: string;
  source: string;
  visitors: number;
};

function TrafficSourceBarChart({ data }: { data: TrafficSourceDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Ingen data i perioden ennå.
      </div>
    );
  }

  const renderValueLabel = (props: LabelProps) => {
    const { height, value, y } = props;

    return (
      <text
        className="fill-foreground"
        dominantBaseline="middle"
        dx={-6}
        fontSize={14}
        textAnchor="end"
        x="100%"
        y={Number(y) + Number(height) / 2}
      >
        {value}
      </text>
    );
  };

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 0,
          right: 48,
        }}
      >
        <CartesianGrid horizontal={false} vertical={false} />
        <YAxis dataKey="source" hide tickLine={false} tickMargin={10} type="category" />
        <XAxis dataKey="visitors" hide type="number" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar barSize={40} dataKey="visitors" fill="var(--color-visitors)" fillOpacity={0.5} radius={8}>
          <LabelList className="fill-foreground" dataKey="source" fontSize={14} offset={12} position="insideLeft" />
          <LabelList content={renderValueLabel} dataKey="label" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function TopTrafficSources({
  sources,
  referrers,
}: {
  sources: TrafficSourceDatum[];
  referrers: TrafficSourceDatum[];
}) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Trafikkilder</CardTitle>
      </CardHeader>

      <CardContent className="px-0">
        <Tabs defaultValue="sources" className="flex flex-col gap-3">
          <TabsList className="w-full justify-start border-b px-2.5" variant="line">
            <TabsTrigger className="flex-none font-normal" value="sources">
              Kilder
            </TabsTrigger>
            <TabsTrigger className="flex-none font-normal" value="referrers">
              Henvisninger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="px-4">
            <TrafficSourceBarChart data={sources} />
          </TabsContent>

          <TabsContent value="referrers" className="px-4">
            <TrafficSourceBarChart data={referrers} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
