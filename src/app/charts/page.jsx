"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";

import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import {
  PieChart,
  pieArcLabelClasses,
  pieArcClasses,
  pieClasses,
} from "@mui/x-charts/PieChart";
import { RadarChart } from "@mui/x-charts/RadarChart";
import { rainbowSurgePalette } from "@mui/x-charts/colorPalettes";
import {
  areaElementClasses,
  lineElementClasses,
} from "@mui/x-charts/LineChart";
import { chartsAxisHighlightClasses } from "@mui/x-charts/ChartsAxisHighlight";

// ----------------- Datos simulados -----------------
const downloads = [1000, 1500, 2000, 1800, 2200, 2500, 2800, 3000];
const weeks = [
  "Jan 1-7",
  "Jan 8-14",
  "Jan 15-21",
  "Jan 22-28",
  "Feb 1-7",
  "Feb 8-14",
  "Feb 15-21",
  "Feb 22-28",
];

const desktopOS = [
  { label: "Windows", value: 45 },
  { label: "macOS", value: 25 },
  { label: "Linux", value: 15 },
  { label: "Otros", value: 15 },
];

const data1 = [
  { label: "Group A", value: 400 },
  { label: "Group B", value: 300 },
  { label: "Group C", value: 300 },
  { label: "Group D", value: 200 },
];

const data2 = [
  { label: "A1", value: 100 },
  { label: "A2", value: 300 },
  { label: "B1", value: 100 },
  { label: "B2", value: 80 },
  { label: "B3", value: 40 },
  { label: "B4", value: 30 },
  { label: "B5", value: 50 },
  { label: "C1", value: 100 },
  { label: "C2", value: 200 },
  { label: "D1", value: 150 },
  { label: "D2", value: 50 },
];

// Radar chart
function valueFormatter(v) {
  if (v === null) return "NaN";
  return `${v.toLocaleString()}t CO2eq/pers`;
}

export default function DashboardDemo() {
  const theme = useTheme();
  const palette = rainbowSurgePalette(theme.palette.mode);

  const sparkSettings = {
    data: downloads,
    baseline: "min",
    margin: { bottom: 0, top: 5, left: 4, right: 0 },
    xAxis: { id: "week-axis", data: weeks },
    yAxis: {
      domainLimit: (_, maxValue) => ({
        min: -maxValue / 6,
        max: maxValue,
      }),
    },
    sx: {
      [`& .${areaElementClasses.root}`]: { opacity: 0.2 },
      [`& .${lineElementClasses.root}`]: { strokeWidth: 3 },
      [`& .${chartsAxisHighlightClasses.root}`]: {
        stroke: "rgb(137, 86, 255)",
        strokeDasharray: "none",
        strokeWidth: 2,
      },
    },
    slotProps: { lineHighlight: { r: 4 } },
    clipAreaOffset: { top: 2, bottom: 2 },
    axisHighlight: { x: "line" },
  };

  return (
    <Box sx={{ flexGrow: 1, p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Dashboard con MUI X Charts
      </Typography>

      <Grid container spacing={3}>
        {/* Sparkline tipo npm downloads */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Downloads
              </Typography>
              <SparkLineChart
                height={50}
                width={300}
                showHighlight
                color="rgb(137, 86, 255)"
                {...sparkSettings}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sparklines básicos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sparklines
              </Typography>
              <Stack direction="row" spacing={4}>
                <SparkLineChart
                  data={[1, 4, 2, 5, 7, 2, 4, 6]}
                  height={100}
                  width={200}
                />
                <SparkLineChart
                  plotType="bar"
                  data={[1, 4, 2, 5, 7, 2, 4, 6]}
                  height={100}
                  width={200}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie con labels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pie con Labels
              </Typography>
              <PieChart
                series={[
                  {
                    data: desktopOS,
                    arcLabel: (item) => `${item.value}%`,
                    arcLabelMinAngle: 35,
                    arcLabelRadius: "60%",
                  },
                ]}
                sx={{
                  [`& .${pieArcLabelClasses.root}`]: {
                    fontWeight: "bold",
                  },
                }}
                width={300}
                height={200}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Pie con CSS Styling */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pie Avanzado
              </Typography>
              <PieChart
                series={[
                  {
                    innerRadius: 0,
                    outerRadius: 80,
                    data: data1,
                    highlightScope: { fade: "global", highlight: "item" },
                  },
                  {
                    id: "outer",
                    innerRadius: 100,
                    outerRadius: 120,
                    data: data2.map((d, i) => ({
                      ...d,
                      color: palette[i % palette.length],
                    })),
                    highlightScope: { fade: "global", highlight: "item" },
                  },
                ]}
                height={300}
                hideLegend
                sx={{
                  [`.${pieClasses.series}[data-series="outer"] .${pieArcClasses.root}`]:
                    {
                      opacity: 0.6,
                    },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Radar Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Multi Series Radar
              </Typography>
              <RadarChart
                height={300}
                series={[
                  {
                    label: "USA",
                    data: [6.65, 2.76, 5.15, 0.19, 0.07, 0.12],
                    valueFormatter,
                  },
                  {
                    label: "Australia",
                    data: [5.52, 5.5, 3.19, 0.51, 0.15, 0.11],
                    valueFormatter,
                  },
                  {
                    label: "United Kingdom",
                    data: [2.26, 0.29, 2.03, 0.05, 0.04, 0.06],
                    valueFormatter,
                  },
                ]}
                radar={{
                  metrics: [
                    "Oil",
                    "Coal",
                    "Gas",
                    "Flaring",
                    "Other\nindustry",
                    "Cement",
                  ],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Pie con paddingAngle */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pie con Padding Angle
              </Typography>
              <Stack width="100%" height={300} direction="row">
                <PieChart
                  series={[
                    {
                      paddingAngle: 5,
                      innerRadius: "60%",
                      outerRadius: "90%",
                      data: data1,
                    },
                  ]}
                  hideLegend
                />
                <PieChart
                  series={[
                    {
                      startAngle: -90,
                      endAngle: 90,
                      paddingAngle: 5,
                      innerRadius: "60%",
                      outerRadius: "90%",
                      data: data1,
                    },
                  ]}
                  hideLegend
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
