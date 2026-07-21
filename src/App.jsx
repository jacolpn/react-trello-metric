import React, { useState, useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Link from "@mui/material/Link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TableChartIcon from "@mui/icons-material/TableChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ReferenceLine, ReferenceArea,
} from "recharts";

import { GlobalStyles } from "./styles/GlobalStyles.jsx";
import { buildTheme, palettes } from "./theme.js";

const CREDENTIALS_KEY = "trello-metrics-credentials";
const BOARD_CONFIG_PREFIX = "trello-metrics-board:";
const METRICS_CACHE_KEY = "trello-metrics-cache";
const MODE_KEY = "trello-metrics-mode";
const CUSTOM_BOARDS_KEY = "trello-metrics-custom-boards";

const BOARDS = [
  { key: "ft", label: "FT", url: "https://trello.com/b/qfV4h6W4/cloud-ft" },
  { key: "banking", label: "Banking", url: "https://trello.com/b/on5ayiTU/cloud-banking" },
  { key: "backoffice", label: "Backoffice", url: "https://trello.com/b/7VKlVCzP/cloud-backoffice" },
  { key: "workflow", label: "WorkFlow", url: "https://trello.com/b/uyITbnaR/cloud-workflow" },
  { key: "duplicatas", label: "Duplicatas", url: "https://trello.com/b/1yNiOyCG/cloud-duplicatas" },
  { key: "arquitetura", label: "Arquitetura", url: "https://trello.com/b/7qmhFAX3/cloud-arquitetura" },
];

const TRELLO_COLORS = {
  green: "#4BCE97", yellow: "#F5CD47", orange: "#FEA362", red: "#F87168",
  purple: "#9F8FEF", blue: "#579DFF", sky: "#6CC3E0", lime: "#94C748",
  pink: "#E774BB", black: "#8590A2", none: "#97A0AF",
};

function chartPalette(mode) {
  return mode === "light"
    ? { primary: "#47b4ec", grid: "#e5e5e5", axis: "#6d7072", tooltipBg: "#ffffff", tooltipBorder: "#e5e5e5", tooltipText: "#1a1a1a" }
    : { primary: "#3aa8e6", grid: "#333333", axis: "#b0b0b0", tooltipBg: "#212121", tooltipBorder: "#333333", tooltipText: "#e5e5e5" };
}

const NAV_ITEMS = [
  { key: "resumo", label: "Visão geral", icon: DashboardIcon },
  { key: "cycle", label: "Cycle time", icon: ShowChartIcon },
  { key: "velocity", label: "Velocity", icon: TrendingUpIcon },
  { key: "categorias", label: "Categorias", icon: LocalOfferIcon },
  { key: "detalhe", label: "Detalhe por card", icon: TableChartIcon },
  { key: "pontuacao", label: "Pontuação", icon: EmojiEventsIcon },
];

function trelloUrl(path, key, token, extra = {}) {
  const url = new URL(`https://api.trello.com/1${path}`);
  url.searchParams.set("key", key);
  url.searchParams.set("token", token);
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

function extractBoardId(input) {
  const trimmed = (input || "").trim();
  const match = trimmed.match(/trello\.com\/b\/([a-zA-Z0-9]+)/);
  if (match) return match[1];
  return trimmed;
}

async function fetchAllActions(boardId, key, token, sinceDate, onProgress) {
  let all = [];
  let before = undefined;
  for (let page = 0; page < 20; page++) {
    const extra = {
      filter: "createCard,updateCard:idList",
      limit: "1000",
      since: sinceDate.toISOString(),
    };
    if (before) extra.before = before;
    const res = await fetch(trelloUrl(`/boards/${boardId}/actions`, key, token, extra));
    if (!res.ok) throw new Error(`Falha ao buscar histórico (${res.status})`);
    const batch = await res.json();
    all = all.concat(batch);
    onProgress && onProgress(all.length);
    if (batch.length < 1000) break;
    before = batch[batch.length - 1].date;
  }
  return all;
}

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(week).padStart(2, "0")}`;
}

function fmtShortDate(ts) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function defaultBoardConfig() {
  return {
    boardInput: "",
    lists: [],
    progressListIds: [],
    doneListIds: [],
    rangeDays: 90,
    allLabels: [],
    categoryLabelIds: [],
    knownLabelIds: [],
  };
}

function loadBoardConfig(boardKey) {
  try {
    const raw = localStorage.getItem(BOARD_CONFIG_PREFIX + boardKey);
    if (raw) return { ...defaultBoardConfig(), ...JSON.parse(raw) };
  } catch (e) {}
  return defaultBoardConfig();
}

function saveBoardConfig(boardKey, cfg) {
  try { localStorage.setItem(BOARD_CONFIG_PREFIX + boardKey, JSON.stringify(cfg)); } catch (e) {}
}

function loadCustomBoards() {
  try {
    const raw = localStorage.getItem(CUSTOM_BOARDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(b => b && b.key && b.url);
    }
  } catch (e) {}
  return [];
}

function saveCustomBoards(boards) {
  try { localStorage.setItem(CUSTOM_BOARDS_KEY, JSON.stringify(boards)); } catch (e) {}
}

function loadMetricsCache() {
  try {
    const raw = localStorage.getItem(METRICS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveMetricsCache(cache) {
  try { localStorage.setItem(METRICS_CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
}

function serializeMetrics(metrics) {
  return {
    ...metrics,
    completed: metrics.completed.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      doneAt: c.doneAt.toISOString(),
    })),
    calculatedAt: new Date().toISOString(),
  };
}

function fmt(n) {
  return n == null ? "—" : n.toFixed(1);
}

function StatTile({ label, value, unit }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{unit}</Typography>
      </Box>
    </Paper>
  );
}

function ReportHeader({ title, description, mode }) {
  const p = palettes[mode] || palettes.light;
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5, color: p.textDark }}>{title}</Typography>
      <Typography variant="body2" sx={{ maxWidth: 640, lineHeight: 1.6, color: p.textLight }}>
        {description}
      </Typography>
    </Box>
  );
}

function DashboardApp() {
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || "light");

  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [showConfig, setShowConfig] = useState(true);
  const [activeReport, setActiveReport] = useState("resumo");

  const [activeBoardKey, setActiveBoardKey] = useState(BOARDS[0].key);
  const [customBoards, setCustomBoards] = useState([]);
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [addBoardUrl, setAddBoardUrl] = useState("");
  const [addBoardLabel, setAddBoardLabel] = useState("");
  const [addBoardError, setAddBoardError] = useState("");

  const allBoards = useMemo(() => [...BOARDS, ...customBoards], [customBoards]);

  const [boardInput, setBoardInput] = useState("");
  const [lists, setLists] = useState([]);
  const [progressListIds, setProgressListIds] = useState(new Set());
  const [doneListIds, setDoneListIds] = useState(new Set());
  const [rangeDays, setRangeDays] = useState(90);

  const [allLabels, setAllLabels] = useState([]);
  const [categoryLabelIds, setCategoryLabelIds] = useState(new Set());
  const [knownLabelIds, setKnownLabelIds] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [cards, setCards] = useState(null);
  const [actions, setActions] = useState(null);
  const [members, setMembers] = useState([]);
  const [customFields, setCustomFields] = useState([]);

  const [metricsCache, setMetricsCache] = useState({});

  useEffect(() => {
    try {
      const rawCreds = localStorage.getItem(CREDENTIALS_KEY);
      if (rawCreds) {
        const creds = JSON.parse(rawCreds);
        setApiKey(creds.apiKey || "");
        setToken(creds.token || "");
      }
    } catch (e) {}
    setMetricsCache(loadMetricsCache());
    setCustomBoards(loadCustomBoards());
    applyBoardConfig(BOARDS[0].key, BOARDS[0].url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveCredentials(nextApiKey, nextToken) {
    try { localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ apiKey: nextApiKey, token: nextToken })); } catch (e) {}
  }

  function applyBoardConfig(boardKey, fallbackUrl) {
    const cfg = loadBoardConfig(boardKey);
    setBoardInput(cfg.boardInput || fallbackUrl || "");
    setLists(cfg.lists || []);
    setProgressListIds(new Set(cfg.progressListIds || []));
    setDoneListIds(new Set(cfg.doneListIds || []));
    setRangeDays(cfg.rangeDays || 90);
    setAllLabels(cfg.allLabels || []);
    setCategoryLabelIds(new Set(cfg.categoryLabelIds || []));
    setKnownLabelIds(new Set(cfg.knownLabelIds || []));
  }

  function persistCurrentBoardConfig(boardKey, overrides = {}) {
    const cfg = {
      boardInput,
      lists,
      progressListIds: Array.from(progressListIds),
      doneListIds: Array.from(doneListIds),
      rangeDays,
      allLabels,
      categoryLabelIds: Array.from(categoryLabelIds),
      knownLabelIds: Array.from(knownLabelIds),
      ...overrides,
    };
    saveBoardConfig(boardKey, cfg);
    return cfg;
  }

  function switchBoard(boardKey) {
    if (boardKey === "__add__") return; // tab de ação, não é um quadro
    if (boardKey === activeBoardKey) return;
    persistCurrentBoardConfig(activeBoardKey);
    setError("");
    setCards(null);
    setActions(null);
    const boardDef = allBoards.find(b => b.key === boardKey);
    applyBoardConfig(boardKey, boardDef ? boardDef.url : "");
    setActiveBoardKey(boardKey);
    setActiveReport("resumo");
    const hasLists = loadBoardConfig(boardKey).lists?.length > 0;
    setShowConfig(!hasLists);
  }

  function openAddBoard() {
    setAddBoardUrl("");
    setAddBoardLabel("");
    setAddBoardError("");
    setAddBoardOpen(true);
  }

  function confirmAddBoard() {
    const boardId = extractBoardId(addBoardUrl);
    if (!boardId) {
      setAddBoardError("Informe uma URL de quadro do Trello válida.");
      return;
    }
    // Reaproveita se o quadro já existe (fixo ou custom) — só troca pra ele.
    const existing = allBoards.find(b => extractBoardId(b.url) === boardId);
    if (existing) {
      setAddBoardOpen(false);
      switchBoard(existing.key);
      return;
    }
    const key = `custom-${boardId}`;
    const label = addBoardLabel.trim() || `Outro (${boardId.slice(0, 6)})`;
    const url = addBoardUrl.trim();
    const nextCustom = [...customBoards, { key, label, url }];
    setCustomBoards(nextCustom);
    saveCustomBoards(nextCustom);
    setAddBoardOpen(false);

    // Mesmo fluxo do switchBoard, mas o boardDef ainda não está em allBoards.
    persistCurrentBoardConfig(activeBoardKey);
    setError("");
    setCards(null);
    setActions(null);
    applyBoardConfig(key, url);
    setActiveBoardKey(key);
    setActiveReport("resumo");
    setShowConfig(true);
  }

  function removeCustomBoard(boardKey) {
    const nextCustom = customBoards.filter(b => b.key !== boardKey);
    setCustomBoards(nextCustom);
    saveCustomBoards(nextCustom);
    try { localStorage.removeItem(BOARD_CONFIG_PREFIX + boardKey); } catch (e) {}
    setMetricsCache(prev => {
      const next = { ...prev };
      delete next[boardKey];
      saveMetricsCache(next);
      return next;
    });
    if (boardKey === activeBoardKey) {
      // volta pro primeiro quadro fixo
      persistCurrentBoardConfig(activeBoardKey);
      setError("");
      setCards(null);
      setActions(null);
      applyBoardConfig(BOARDS[0].key, BOARDS[0].url);
      setActiveBoardKey(BOARDS[0].key);
      setActiveReport("resumo");
      const hasLists = loadBoardConfig(BOARDS[0].key).lists?.length > 0;
      setShowConfig(!hasLists);
    }
  }

  function reconcileCategoryIds(currentLabels, savedIds, seenIds) {
    const currentIds = currentLabels.map(l => l.id);
    const currentSet = new Set(currentIds);
    const stillValidSaved = currentIds.filter(id => savedIds.has(id));
    const brandNewIds = currentIds.filter(id => !seenIds.has(id));
    const nextCategoryIds = new Set([...stillValidSaved, ...brandNewIds]);
    if (nextCategoryIds.size === 0) return { categoryIds: currentSet, seenIds: currentSet };
    return { categoryIds: nextCategoryIds, seenIds: currentSet };
  }

  async function loadLists() {
    setError(""); setLoading(true); setLoadingMsg("Carregando listas e etiquetas do quadro...");
    try {
      const boardId = extractBoardId(boardInput);
      const [listsRes, labelsRes] = await Promise.all([
        fetch(trelloUrl(`/boards/${boardId}/lists`, apiKey, token, { fields: "name" })),
        fetch(trelloUrl(`/boards/${boardId}/labels`, apiKey, token, { fields: "name,color", limit: "1000" })),
      ]);
      if (!listsRes.ok) throw new Error(listsRes.status === 401 ? "API Key ou Token inválidos." : `Erro ao buscar listas (${listsRes.status})`);
      if (!labelsRes.ok) throw new Error(`Erro ao buscar etiquetas (${labelsRes.status})`);
      const listsData = await listsRes.json();
      const labelsData = await labelsRes.json();
      setLists(listsData);
      setAllLabels(labelsData);
      const { categoryIds, seenIds } = reconcileCategoryIds(labelsData, categoryLabelIds, knownLabelIds);
      setCategoryLabelIds(categoryIds);
      setKnownLabelIds(seenIds);
      saveCredentials(apiKey, token);
      persistCurrentBoardConfig(activeBoardKey, {
        lists: listsData, allLabels: labelsData,
        categoryLabelIds: Array.from(categoryIds), knownLabelIds: Array.from(seenIds),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setError(""); setLoading(true); setCards(null); setActions(null);
    try {
      const boardId = extractBoardId(boardInput);
      setLoadingMsg("Buscando cards e etiquetas do quadro...");
      const [cardsRes, labelsRes, membersRes, customFieldsRes] = await Promise.all([
        fetch(trelloUrl(`/boards/${boardId}/cards`, apiKey, token, {
          fields: "id,name,idList,idBoard,closed,dateLastActivity,idLabels,idMembers,shortLink,url",
          customFieldItems: "true",
        })),
        fetch(trelloUrl(`/boards/${boardId}/labels`, apiKey, token, { fields: "name,color", limit: "1000" })),
        fetch(trelloUrl(`/boards/${boardId}/members`, apiKey, token, { fields: "fullName,username" })),
        fetch(trelloUrl(`/boards/${boardId}/customFields`, apiKey, token)),
      ]);
      if (!cardsRes.ok) throw new Error(`Erro ao buscar cards (${cardsRes.status})`);
      if (!labelsRes.ok) throw new Error(`Erro ao buscar etiquetas (${labelsRes.status})`);
      const cardsData = await cardsRes.json();
      const labelsData = await labelsRes.json();
      // membros e custom fields são opcionais: se o Power-Up de Custom Fields
      // não estiver habilitado ou a chamada falhar, a pontuação por dev
      // simplesmente não aparece — o resto do dashboard continua funcionando.
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const customFieldsData = customFieldsRes.ok ? await customFieldsRes.json() : [];

      setAllLabels(labelsData);
      setMembers(membersData);
      setCustomFields(customFieldsData);
      const { categoryIds, seenIds } = reconcileCategoryIds(labelsData, categoryLabelIds, knownLabelIds);
      setCategoryLabelIds(categoryIds);
      setKnownLabelIds(seenIds);

      const since = new Date(Date.now() - rangeDays * 86400000);
      setLoadingMsg("Buscando histórico de movimentações...");
      const actionsData = await fetchAllActions(boardId, apiKey, token, since, (n) =>
        setLoadingMsg(`Buscando histórico de movimentações... (${n} ações)`)
      );

      setCards(cardsData);
      setActions(actionsData);
      saveCredentials(apiKey, token);
      persistCurrentBoardConfig(activeBoardKey, {
        allLabels: labelsData,
        categoryLabelIds: Array.from(categoryIds), knownLabelIds: Array.from(seenIds),
      });
      setShowConfig(false);
      setActiveReport("resumo");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const freshMetrics = useMemo(() => {
    if (!cards || !actions) return null;

    const labelById = {};
    for (const l of allLabels) labelById[l.id] = l;

    const memberById = {};
    for (const m of members) memberById[m.id] = m.fullName || m.username || m.id;

    // Campo de pontuação = custom field numérico chamado "Complexidade"
    // (equivalente ao Story Points do Jira). Casamos pelo nome, sem
    // diferenciar maiúsculas/acentos, e só aceitamos type "number".
    const complexityField = customFields.find(
      f => f.type === "number" && (f.name || "").trim().toLowerCase() === "complexidade"
    );
    const cardPoints = (card) => {
      if (!complexityField) return null;
      const item = (card.customFieldItems || []).find(i => i.idCustomField === complexityField.id);
      const raw = item?.value?.number;
      if (raw == null || raw === "") return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    };

    const actionsByCard = {};
    for (const a of actions) {
      const cardId = a.data?.card?.id;
      if (!cardId) continue;
      (actionsByCard[cardId] = actionsByCard[cardId] || []).push(a);
    }

    const completed = [];
    for (const card of cards) {
      const acts = (actionsByCard[card.id] || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
      let createdAt = null, cycleStart = null, cycleEnd = null;
      for (const a of acts) {
        if (a.type === "createCard") {
          createdAt = new Date(a.date);
        } else if (a.type === "updateCard" && a.data?.listAfter) {
          const listId = a.data.listAfter.id;
          const when = new Date(a.date);
          if (!cycleStart && progressListIds.has(listId)) cycleStart = when;
          if (!cycleEnd && doneListIds.has(listId)) cycleEnd = when;
        }
      }
      if (!createdAt) {
        const ts = parseInt(card.id.substring(0, 8), 16) * 1000;
        createdAt = new Date(ts);
      }
      if (cycleEnd) {
        const leadDays = (cycleEnd - createdAt) / 86400000;
        const cycleDays = cycleStart ? (cycleEnd - cycleStart) / 86400000 : null;
        const relevantIds = (card.idLabels || []).filter(id => categoryLabelIds.has(id));
        completed.push({
          id: card.id, name: card.name,
          url: card.url || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : `https://trello.com/c/${card.id}`),
          category: labelById[relevantIds[0]]?.name || "Sem categoria",
          createdAt, doneAt: cycleEnd, leadDays, cycleDays,
          points: cardPoints(card),
          memberIds: card.idMembers || [],
        });
      }
    }

    const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    const median = (arr) => {
      if (!arr.length) return null;
      const s = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    };
    const stdev = (arr, mean) => {
      if (arr.length < 2) return null;
      const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
      return Math.sqrt(variance);
    };
    const leadValues = completed.map(c => c.leadDays);
    const cycleValues = completed.filter(c => c.cycleDays != null).map(c => c.cycleDays);
    const avgCycle = cycleValues.length ? avg(cycleValues) : null;
    const medianCycle = median(cycleValues);
    // banda "normal" à la Jira: ±1 desvio padrão em torno da média, sem excluir cards do cálculo
    const cycleStd = avgCycle != null ? stdev(cycleValues, avgCycle) : null;
    const cycleBandLow = cycleStd != null ? Math.max(0, avgCycle - cycleStd) : null;
    const cycleBandHigh = cycleStd != null ? avgCycle + cycleStd : null;

    const cycleScatter = completed
      .filter(c => c.cycleDays != null)
      .map(c => ({ x: c.doneAt.getTime(), y: Number(c.cycleDays.toFixed(1)), name: c.name, url: c.url }))
      .sort((a, b) => a.x - b.x);

    const weekMap = {};
    for (const c of completed) {
      const wk = isoWeekKey(c.doneAt);
      weekMap[wk] = (weekMap[wk] || 0) + 1;
    }
    const velocity = Object.entries(weekMap).sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count }));
    const avgVelocity = velocity.length ? avg(velocity.map(v => v.count)) : null;

    const catMap = {};
    const catColor = {};
    for (const card of cards) {
      const relevantIds = (card.idLabels || []).filter(id => categoryLabelIds.has(id));
      const labelList = relevantIds.length
        ? relevantIds.map(id => labelById[id]).filter(Boolean)
        : [{ name: "Sem categoria", color: "none" }];
      for (const l of labelList) {
        const name = l.name || "(sem nome)";
        catMap[name] = (catMap[name] || 0) + 1;
        catColor[name] = TRELLO_COLORS[l.color] || TRELLO_COLORS.none;
      }
    }
    const categories = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count, color: catColor[name] }));

    // Pontuação por dev (estilo velocity individual do Jira): para cada card
    // concluído, cada membro do card recebe os pontos CHEIOS de Complexidade
    // (card com 2 devs conta os pontos inteiros pra cada um). Cards sem membro
    // caem em "Sem responsável"; cards sem Complexidade preenchida somam 0 pts
    // mas ainda contam como card concluído — a coluna de cards sem pontuação
    // dá visibilidade do gap de estimativa.
    const hasComplexity = !!complexityField;
    const devMap = {};
    for (const c of completed) {
      const ids = c.memberIds.length ? c.memberIds : ["__none__"];
      for (const id of ids) {
        const name = id === "__none__" ? "Sem responsável" : (memberById[id] || "Desconhecido");
        const d = devMap[name] || (devMap[name] = { name, cards: 0, points: 0, unscored: 0 });
        d.cards += 1;
        if (c.points != null) d.points += c.points;
        else d.unscored += 1;
      }
    }
    const pointsByDev = Object.values(devMap)
      .map(d => ({ ...d, avgPoints: d.cards ? d.points / d.cards : 0 }))
      .sort((a, b) => b.points - a.points || b.cards - a.cards);

    return {
      completedCount: completed.length,
      avgLead: avg(leadValues),
      avgCycle,
      medianCycle,
      cycleBandLow,
      cycleBandHigh,
      avgVelocity,
      velocity,
      categories,
      cycleScatter,
      pointsByDev,
      hasComplexity,
      completed: completed.sort((a, b) => b.doneAt - a.doneAt),
    };
  }, [cards, actions, progressListIds, doneListIds, categoryLabelIds, allLabels, members, customFields]);

  useEffect(() => {
    if (!freshMetrics) return;
    const serialized = { ...serializeMetrics(freshMetrics), rangeDays };
    setMetricsCache(prev => {
      const next = { ...prev, [activeBoardKey]: serialized };
      saveMetricsCache(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshMetrics]);

  const metrics = freshMetrics || metricsCache[activeBoardKey] || null;
  const isCachedView = !freshMetrics && !!metricsCache[activeBoardKey];

  function toggleList(id, setFn, set) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFn(next);
  }

  function toggleCategoryLabel(id) {
    const next = new Set(categoryLabelIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCategoryLabelIds(next);
  }

  const palette = chartPalette(mode);

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    try { localStorage.setItem(MODE_KEY, next); } catch (e) {}
  }

  return (
    <ThemeProvider theme={buildTheme(mode)}>
      <GlobalStyles mode={mode} />
      <CssBaseline />

      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Relatórios
            </Typography>
            <Typography variant="h6">Métricas de fluxo do Trello</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={toggleMode} aria-label="alternar tema">
              {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              endIcon={showConfig ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowConfig(v => !v)}
            >
              Configuração
            </Button>
          </Box>
        </Toolbar>
        <Tabs
          value={activeBoardKey}
          onChange={(_e, val) => switchBoard(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderTop: "1px solid", borderColor: "divider", px: 1 }}
        >
          {allBoards.map(b => {
            const cached = metricsCache[b.key];
            const isCustom = b.key.startsWith("custom-");
            return (
              <Tab
                key={b.key}
                value={b.key}
                icon={<ViewKanbanIcon fontSize="small" />}
                iconPosition="start"
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ textAlign: "left", lineHeight: 1.2 }}>
                      <Typography variant="body2" component="div">{b.label}</Typography>
                      <Typography variant="caption" component="div" sx={{ color: (palettes[mode] || palettes.light).textLight }}>
                        {cached ? `${cached.rangeDays}d · cycle ${fmt(cached.avgCycle)}d` : "não calculado"}
                      </Typography>
                    </Box>
                    {isCustom && (
                      <IconButton
                        component="span"
                        size="small"
                        aria-label={`Remover ${b.label}`}
                        onClick={(e) => { e.stopPropagation(); removeCustomBoard(b.key); }}
                        sx={{ p: 0.25 }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Box>
                }
                sx={{ minHeight: 56, alignItems: "flex-start", pt: 1 }}
              />
            );
          })}
          <Tab
            key="__add__"
            value="__add__"
            onClick={(e) => { e.preventDefault(); openAddBoard(); }}
            icon={<AddIcon fontSize="small" />}
            iconPosition="start"
            label="Outro"
            sx={{ minHeight: 56, alignItems: "flex-start", pt: 1 }}
          />
        </Tabs>
      </AppBar>

      <Dialog open={addBoardOpen} onClose={() => setAddBoardOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar outro quadro</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Cole a URL do quadro do Trello que deseja acompanhar. Ele fica salvo
            só neste navegador.
          </Typography>
          <TextField
            label="URL do quadro"
            fullWidth
            size="small"
            autoFocus
            value={addBoardUrl}
            onChange={e => { setAddBoardUrl(e.target.value); setAddBoardError(""); }}
            onKeyDown={e => { if (e.key === "Enter") confirmAddBoard(); }}
            placeholder="https://trello.com/b/xxxxxxxx/nome-do-quadro"
            error={!!addBoardError}
            helperText={addBoardError || " "}
            sx={{ mb: 1 }}
          />
          <TextField
            label="Nome (opcional)"
            fullWidth
            size="small"
            value={addBoardLabel}
            onChange={e => setAddBoardLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") confirmAddBoard(); }}
            placeholder="Como aparecerá na aba"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBoardOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmAddBoard}>Adicionar</Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Collapse in={showConfig}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="API Key" fullWidth size="small"
                  value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="Sua API key do Trello"
                />
                <Link href="https://trello.com/power-ups/admin/api-key" target="_blank" rel="noreferrer" variant="caption" sx={{ mt: 0.5, display: "inline-block" }}>
                  Gerar API key ↗
                </Link>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Token" fullWidth size="small"
                  value={token} onChange={e => setToken(e.target.value)}
                  placeholder="Seu token de acesso"
                />
                {apiKey && (
                  <Link
                    href={`https://trello.com/1/authorize?expiration=never&scope=read&response_type=token&key=${apiKey}&name=Metricas%20de%20Fluxo`}
                    target="_blank" rel="noreferrer" variant="caption" sx={{ mt: 0.5, display: "inline-block" }}
                  >
                    Gerar token ↗
                  </Link>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Quadro selecionado na barra acima. A URL é preenchida automaticamente.
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth size="small"
                    value={boardInput}
                    disabled
                  />
                  <Button
                    variant="contained" disableElevation
                    onClick={loadLists}
                    disabled={!apiKey || !token || !boardInput || loading}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Carregar listas
                  </Button>
                </Box>
              </Grid>

              {lists.length > 0 && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Listas de <b>"em andamento"</b> (início do cycle time)
                    </Typography>
                    <Paper variant="outlined" sx={{ maxHeight: 160, overflowY: "auto", p: 1 }}>
                      <FormGroup>
                        {lists.map(l => (
                          <FormControlLabel
                            key={l.id}
                            control={<Checkbox size="small" checked={progressListIds.has(l.id)} onChange={() => toggleList(l.id, setProgressListIds, progressListIds)} />}
                            label={<Typography variant="body2">{l.name}</Typography>}
                          />
                        ))}
                      </FormGroup>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Listas de <b>"concluído"</b> (fim do lead/cycle time)
                    </Typography>
                    <Paper variant="outlined" sx={{ maxHeight: 160, overflowY: "auto", p: 1 }}>
                      <FormGroup>
                        {lists.map(l => (
                          <FormControlLabel
                            key={l.id}
                            control={<Checkbox size="small" checked={doneListIds.has(l.id)} onChange={() => toggleList(l.id, setDoneListIds, doneListIds)} />}
                            label={<Typography variant="body2">{l.name}</Typography>}
                          />
                        ))}
                      </FormGroup>
                    </Paper>
                  </Grid>
                </>
              )}

              {allLabels.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Quais etiquetas representam <b>categoria</b> (bug, melhoria, roadmap...)? Desmarque as que são
                    time/projeto/contexto — elas ficam de fora do gráfico de categorias.
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {allLabels.map(l => {
                      const active = categoryLabelIds.has(l.id);
                      const bg = TRELLO_COLORS[l.color] || TRELLO_COLORS.none;
                      return (
                        <Chip
                          key={l.id}
                          label={l.name || "(sem nome)"}
                          onClick={() => toggleCategoryLabel(l.id)}
                          sx={{
                            bgcolor: bg, color: "#fff", opacity: active ? 1 : 0.35,
                            fontWeight: 500, "&:hover": { bgcolor: bg, opacity: active ? 0.85 : 0.5 },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm="auto">
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Período de análise</InputLabel>
                  <Select
                    label="Período de análise"
                    value={rangeDays} onChange={e => setRangeDays(Number(e.target.value))}
                  >
                    <MenuItem value={7}>Últimos 7 dias</MenuItem>
                    <MenuItem value={15}>Últimos 15 dias</MenuItem>
                    <MenuItem value={30}>Últimos 30 dias</MenuItem>
                    <MenuItem value={60}>Últimos 60 dias</MenuItem>
                    <MenuItem value={90}>Últimos 90 dias</MenuItem>
                    <MenuItem value={180}>Últimos 180 dias</MenuItem>
                    <MenuItem value={365}>Últimos 365 dias</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm="auto" sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  variant="contained" color="success" disableElevation
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                  onClick={runAnalysis}
                  disabled={loading || !boardInput || doneListIds.size === 0}
                >
                  Calcular métricas
                </Button>
                {loading && <Typography variant="caption" color="text.secondary">{loadingMsg}</Typography>}
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                  Suas credenciais (API key/token) valem para todos os quadros e ficam salvas apenas no localStorage
                  do seu navegador. A configuração de listas, etiquetas e período é salva por quadro.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {isCachedView && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Mostrando dados calculados em {new Date(metrics.calculatedAt).toLocaleString("pt-BR")}. Clique em
            "Configuração" → "Calcular métricas" para atualizar.
          </Alert>
        )}

        {metrics && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <List disablePadding>
                  {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                      <ListItemButton
                        key={item.key}
                        selected={activeReport === item.key}
                        onClick={() => setActiveReport(item.key)}
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}><Icon fontSize="small" /></ListItemIcon>
                        <ListItemText primary={item.label} primaryTypographyProps={{ variant: "body2" }} />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={9}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                {activeReport === "resumo" && (
                  <>
                    <ReportHeader
                    mode={mode}
                      title="Visão geral"
                      description="Um resumo rápido de como o fluxo de trabalho do quadro se comportou no período selecionado."
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}><StatTile label="Lead time médio" value={fmt(metrics.avgLead)} unit="dias" /></Grid>
                      <Grid item xs={6} sm={3}><StatTile label="Cycle time médio" value={fmt(metrics.avgCycle)} unit="dias" /></Grid>
                      <Grid item xs={6} sm={3}><StatTile label="Cycle time (mediana)" value={fmt(metrics.medianCycle)} unit="dias" /></Grid>
                      <Grid item xs={6} sm={3}><StatTile label="Velocity média" value={fmt(metrics.avgVelocity)} unit="cards/semana" /></Grid>
                      <Grid item xs={6} sm={3}><StatTile label="Cards concluídos" value={metrics.completedCount} unit={`nos últimos ${rangeDays}d`} /></Grid>
                    </Grid>
                  </>
                )}

                {activeReport === "cycle" && (
                  <>
                    <ReportHeader
                    mode={mode}
                      title="Control chart — cycle time"
                      description="Cada ponto é um card concluído, posicionado pela data de conclusão e pelo tempo entre entrar em 'em andamento' e ser finalizado. A linha cheia é a mediana do período (o card 'típico', que não é distorcida por poucos cards muito lentos); a linha tracejada é a média. A faixa sombreada é a variação normal (±1 desvio) — pontos fora dela são os cards que ficaram muito fora do padrão."
                    />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1, fontSize: 12, color: palette.axis }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box component="span" sx={{ width: 16, height: 0, borderTop: `2px solid ${palette.primary}` }} />
                        mediana <b style={{ color: palette.primary }}>{fmt(metrics.medianCycle)}d</b>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box component="span" sx={{ width: 16, height: 0, borderTop: `2px dashed ${palette.axis}` }} />
                        média <b>{fmt(metrics.avgCycle)}d</b>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box component="span" sx={{ width: 16, height: 12, background: palette.primary, opacity: 0.12, borderRadius: "2px" }} />
                        variação normal (±1 desvio)
                      </Box>
                    </Box>
                    <Box sx={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer>
                        <ScatterChart margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke={palette.grid} />
                          <XAxis
                            dataKey="x" type="number" domain={["dataMin", "dataMax"]}
                            tickFormatter={fmtShortDate} tick={{ fill: palette.axis, fontSize: 11 }}
                            axisLine={{ stroke: palette.grid }} tickLine={false}
                          />
                          <YAxis
                            dataKey="y" type="number" name="Cycle time"
                            tick={{ fill: palette.axis, fontSize: 11 }} axisLine={false} tickLine={false}
                            label={{ value: "dias", angle: -90, position: "insideLeft", fill: palette.axis, fontSize: 11 }}
                          />
                          <Tooltip
                            cursor={{ stroke: palette.grid }}
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              const p = payload[0].payload;
                              return (
                                <Box sx={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: "6px", fontSize: 12, color: palette.tooltipText, p: 1 }}>
                                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                                  <div>{p.y} dias em execução</div>
                                </Box>
                              );
                            }}
                          />
                          {metrics.cycleBandLow != null && (
                            <ReferenceArea y1={metrics.cycleBandLow} y2={metrics.cycleBandHigh}
                              fill={palette.primary} fillOpacity={0.08} stroke="none" />
                          )}
                          {metrics.avgCycle != null && (
                            <ReferenceLine y={metrics.avgCycle} stroke={palette.axis} strokeDasharray="4 4" />
                          )}
                          {metrics.medianCycle != null && (
                            <ReferenceLine y={metrics.medianCycle} stroke={palette.primary} strokeWidth={2} />
                          )}
                          <Scatter
                            data={metrics.cycleScatter}
                            fill={palette.primary}
                            cursor="pointer"
                            onClick={(p) => { if (p?.url) window.open(p.url, "_blank", "noopener,noreferrer"); }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </Box>
                  </>
                )}

                {activeReport === "velocity" && (
                  <>
                    <ReportHeader
                    mode={mode}
                      title="Velocity"
                      description="Quantidade de cards concluídos por semana. Ajuda a entender a capacidade real do time e a projetar prazos com base no histórico, em vez de estimativas."
                    />
                    <Box sx={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={metrics.velocity} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke={palette.grid} vertical={false} />
                          <XAxis dataKey="week" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.grid }} tickLine={false} />
                          <YAxis tick={{ fill: palette.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 6, fontSize: 12, color: palette.tooltipText }}
                            labelStyle={{ color: palette.tooltipText }}
                            itemStyle={{ color: palette.tooltipText }}
                            cursor={{ fill: palette.grid, fillOpacity: 0.2 }}
                          />
                          <Bar dataKey="count" name="Cards concluídos" fill={palette.primary} radius={[3, 3, 0, 0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </>
                )}

                {activeReport === "categorias" && (
                  <>
                    <ReportHeader
                    mode={mode}
                      title="Cards por categoria"
                      description="Distribuição dos cards concluídos por etiqueta. Só entram aqui as etiquetas marcadas como categoria na configuração — as demais (time, projeto, contexto) ficam de fora."
                    />
                    <Box sx={{ width: "100%", height: Math.max(160, metrics.categories.length * 34) }}>
                      <ResponsiveContainer>
                        <BarChart data={metrics.categories} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                          <CartesianGrid stroke={palette.grid} horizontal={false} />
                          <XAxis type="number" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.grid }} tickLine={false} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" width={140} tick={{ fill: palette.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 6, fontSize: 12, color: palette.tooltipText }}
                            labelStyle={{ color: palette.tooltipText }}
                            itemStyle={{ color: palette.tooltipText }}
                            cursor={{ fill: palette.grid, fillOpacity: 0.2 }}
                          />
                          <Bar dataKey="count" name="Cards" radius={[0, 3, 3, 0]} maxBarSize={20}>
                            {metrics.categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </>
                )}

                {activeReport === "detalhe" && (
                  <>
                    <ReportHeader
                    mode={mode}
                      title="Detalhe por card"
                      description={`${metrics.completed.length} cards concluídos no período, com o tempo individual de cada um.`}
                    />
                    <TableContainer sx={{ maxHeight: 448 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Card</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell align="right">Concluído em</TableCell>
                            <TableCell align="right">Lead time (d)</TableCell>
                            <TableCell align="right">Cycle time (d)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {metrics.completed.map(c => (
                            <TableRow key={c.id} hover>
                              <TableCell>{c.name}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{c.category}</TableCell>
                              <TableCell align="right">{new Date(c.doneAt).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace" }}>{fmt(c.leadDays)}</TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace" }}>{fmt(c.cycleDays)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {activeReport === "pontuacao" && (
                  <>
                    <ReportHeader
                      mode={mode}
                      title="Pontuação por dev"
                      description={
                        metrics.hasComplexity
                          ? "Soma da Complexidade (custom field, equivalente ao Story Points do Jira) dos cards concluídos, por responsável. Cards com mais de um dev contam os pontos cheios para cada um, então o total por dev pode ultrapassar o total do quadro."
                          : "Nenhum custom field numérico chamado \"Complexidade\" foi encontrado neste quadro. Habilite o Power-Up de Custom Fields no Trello e crie o campo para ver a pontuação por dev."
                      }
                    />
                    {metrics.hasComplexity && (
                      <TableContainer sx={{ maxHeight: 448 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Dev</TableCell>
                              <TableCell align="right">Cards concluídos</TableCell>
                              <TableCell align="right">Pontos</TableCell>
                              <TableCell align="right">Média pts/card</TableCell>
                              <TableCell align="right">Sem pontuação</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {metrics.pointsByDev.map(d => (
                              <TableRow key={d.name} hover>
                                <TableCell>{d.name}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>{d.cards}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>{fmt(d.points)}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>{fmt(d.avgPoints)}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: "monospace", color: d.unscored ? "warning.main" : "text.secondary" }}>{d.unscored || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {!metrics && !showConfig && (
          <Typography align="center" color="text.secondary" variant="body2" sx={{ py: 6 }}>
            Abra a configuração acima para conectar este quadro.
          </Typography>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default function App() {
  return <DashboardApp />;
}
