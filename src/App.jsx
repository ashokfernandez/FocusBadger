import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useClipboard,
  useDisclosure
} from "@chakra-ui/react";
import {
  addProject as addProjectHelper,
  buildSnapshot,
  collectProjects,
  deleteProject as deleteProjectHelper,
  hydrateRecords,
  renameProject as renameProjectHelper
} from "./projects.js";
import {
  ALL_PROJECTS,
  UNASSIGNED_LABEL,
  MATRIX_SORTS,
  classifyTaskPriority,
  shouldIncludeTaskInMatrix,
  sortMatrixEntries
} from "./matrix.js";
import { TOOLBAR_SORTS, projectSectionsFrom } from "./toolbar.js";
import { buildJSONExport, parseJSONInput } from "./jsonEditor.js";
import { createTaskPayload } from "./taskFactory.js";
import { prepareTaskTitleRename } from "./taskRename.js";
import AddTaskModal from "./components/AddTaskModal.jsx";
import GlobalToolbar from "./components/GlobalToolbar.jsx";
import TaskEditor from "./components/TaskEditor.jsx";
import ProjectManagerModal from "./components/ProjectManagerModal.jsx";
import DemoDataBanner from "./components/DemoDataBanner.jsx";
import WorkspaceHeader from "./components/WorkspaceHeader.jsx";
import PriorityMatrixSection from "./components/PriorityMatrixSection.jsx";
import ProjectsPanel from "./components/ProjectsPanel.jsx";
import AssistantWorkflowModal from "./components/AssistantWorkflowModal.jsx";
import MatrixSortControl from "./components/MatrixSortControl.jsx";
const DEFAULT_MATRIX_FILTERS = [ALL_PROJECTS];
const STORAGE_MODE_KEY = "taskbadger:storageMode";
const STORAGE_MODE_LOCAL = "local";
const STORAGE_MODE_FILE = "file";
const STORAGE_SNAPSHOT_KEY = "taskbadger:snapshot";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [matrixFilters, setMatrixFilters] = useState(DEFAULT_MATRIX_FILTERS);
  const [matrixSortMode, setMatrixSortMode] = useState(MATRIX_SORTS.SCORE);
  const projectSortMode = TOOLBAR_SORTS.SCORE;
  const fileHandleRef = useRef(null);
  const disclosure = useDisclosure();
  const projectManagerDisclosure = useDisclosure();
  const addTaskDisclosure = useDisclosure();
  const jsonModal = useDisclosure();
  const lastSavedRef = useRef("");
  const saveTimeoutRef = useRef(null);
  const hasLoadedStoredSnapshotRef = useRef(false);
  const [saveState, setSaveState] = useState({ status: "idle" });
  const [jsonTabIndex, setJsonTabIndex] = useState(0);
  const [jsonInputValue, setJsonInputValue] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [jsonParsed, setJsonParsed] = useState(null);
  const [isJsonSaving, setIsJsonSaving] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const [workspaceTabIndex, setWorkspaceTabIndex] = useState(0);
  const [storageMode, setStorageMode] = useState(() => {
    if (typeof window === "undefined") return STORAGE_MODE_FILE;
    const stored = window.localStorage.getItem(STORAGE_MODE_KEY);
    return stored === STORAGE_MODE_LOCAL ? STORAGE_MODE_LOCAL : STORAGE_MODE_FILE;
  });
  const isLocalStorageMode = storageMode === STORAGE_MODE_LOCAL;
  const hasUnassignedTasks = useMemo(
    () => tasks.some((task) => !(task.project?.trim())),
    [tasks]
  );
  const jsonExportText = useMemo(() => buildJSONExport(tasks, projects), [tasks, projects]);
  const clipboard = useClipboard(jsonExportText);
  const canSaveJson = jsonTabIndex === 1 && jsonParsed?.ok && !jsonError;
  useEffect(() => {
    setProjects((prev) => {
      const derived = collectProjects(
        tasks,
        prev.map((name) => ({ type: "project", name }))
      );
      if (derived.length === prev.length && derived.every((name, idx) => name === prev[idx])) {
        return prev;
      }
      return derived;
    });
  }, [tasks]);

  useEffect(() => {
    if (!jsonModal.isOpen) return;
    if (jsonTabIndex !== 0) return;
    const initial = parseJSONInput(jsonExportText);
    setJsonInputValue(jsonExportText);
    if (initial.ok) {
      setJsonParsed(initial);
      setJsonError("");
    } else {
      setJsonParsed(null);
      setJsonError(initial.error ?? "");
    }
  }, [jsonModal.isOpen, jsonExportText, jsonTabIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.showOpenFilePicker) {
      setShowDemoBanner(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_MODE_KEY, storageMode);
    } catch (error) {
      console.error(error);
    }
  }, [storageMode]);

  useEffect(() => {
    if (hasLoadedStoredSnapshotRef.current) return;
    if (!isLocalStorageMode) return;
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_SNAPSHOT_KEY);
      if (!stored) {
        hasLoadedStoredSnapshotRef.current = true;
        return;
      }
      const parsed = parseJSONInput(stored);
      if (!parsed?.ok) {
        hasLoadedStoredSnapshotRef.current = true;
        return;
      }
      const { tasks: storedTasks, projects: storedProjects } = parsed;
      setTasks(storedTasks);
      setProjects(storedProjects);
      const snapshot = buildSnapshot(storedTasks, storedProjects);
      lastSavedRef.current = snapshot;
      setSaveState({ status: storedTasks.length || storedProjects.length ? "saved" : "idle" });
      hasLoadedStoredSnapshotRef.current = true;
    } catch (error) {
      console.error(error);
      hasLoadedStoredSnapshotRef.current = true;
    }
  }, [isLocalStorageMode, buildSnapshot]);

  useEffect(() => {
    setMatrixFilters((prev) => {
      if (prev.includes(ALL_PROJECTS)) return DEFAULT_MATRIX_FILTERS;
      const allowed = new Set(projects);
      if (hasUnassignedTasks) {
        allowed.add(UNASSIGNED_LABEL);
      }
      const next = prev.filter((value) => value === ALL_PROJECTS || allowed.has(value));
      return next.length ? next : DEFAULT_MATRIX_FILTERS;
    });
  }, [projects, hasUnassignedTasks]);

  const matrixFilterOptions = useMemo(() => {
    const options = [ALL_PROJECTS, ...projects];
    if (hasUnassignedTasks) {
      options.push(UNASSIGNED_LABEL);
    }
    return options;
  }, [projects, hasUnassignedTasks]);

  const clearPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const writeToHandle = useCallback(async (handle, text) => {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  }, []);

  const ensureHandleForSave = useCallback(async () => {
    if (fileHandleRef.current) return fileHandleRef.current;
    if (!window.showSaveFilePicker) {
      alert("Use a Chromium browser for File System Access support");
      return null;
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: "tasks.jsonl",
      types: [{ description: "JSONL", accept: { "text/plain": [".jsonl"] } }]
    });
    fileHandleRef.current = handle;
    return handle;
  }, []);

  const matrix = useMemo(() => {
    const now = new Date();
    const groups = {
      today: [],
      schedule: [],
      delegate: [],
      consider: []
    };

    tasks.forEach((task, index) => {
      if (task.done) return;
      const priority = classifyTaskPriority(task, now);

      if (!shouldIncludeTaskInMatrix(task, matrixFilters)) return;

      if (priority.isUrgent && priority.isImportant) {
        groups.today.push({ task, index, priority });
      } else if (!priority.isUrgent && priority.isImportant) {
        groups.schedule.push({ task, index, priority });
      } else if (priority.isUrgent && !priority.isImportant) {
        groups.delegate.push({ task, index, priority });
      } else {
        groups.consider.push({ task, index, priority });
      }
    });

    return {
      today: sortMatrixEntries(groups.today, matrixSortMode),
      schedule: sortMatrixEntries(groups.schedule, matrixSortMode),
      delegate: sortMatrixEntries(groups.delegate, matrixSortMode),
      consider: sortMatrixEntries(groups.consider, matrixSortMode)
    };
  }, [tasks, matrixFilters, matrixSortMode]);

  const projectGroups = useMemo(
    () => projectSectionsFrom(tasks, projects, projectSortMode, matrixFilters),
    [tasks, projects, projectSortMode, matrixFilters]
  );

  const projectUsage = useMemo(() => {
    const counts = {};
    tasks.forEach((task) => {
      const name = task.project?.trim();
      if (!name) return;
      counts[name] = (counts[name] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  useEffect(() => {
    const snapshot = buildSnapshot(tasks, projects);

    if (isLocalStorageMode) {
      clearPendingSave();
      if (typeof window === "undefined") {
        setSaveState({ status: tasks.length || projects.length ? "unsynced" : "idle" });
        return () => {};
      }
      if (!tasks.length && !projects.length) {
        try {
          window.localStorage.removeItem(STORAGE_SNAPSHOT_KEY);
        } catch (error) {
          console.error(error);
        }
        lastSavedRef.current = "";
        setSaveState({ status: "idle" });
        return () => {};
      }
      if (snapshot === lastSavedRef.current) {
        setSaveState({ status: "saved" });
        return () => {};
      }
      setSaveState({ status: "saving" });
      const timeout = setTimeout(() => {
        try {
          window.localStorage.setItem(STORAGE_SNAPSHOT_KEY, snapshot);
          lastSavedRef.current = snapshot;
          setSaveState({ status: "saved", timestamp: Date.now() });
        } catch (error) {
          console.error(error);
          setSaveState({ status: "error", error });
        } finally {
          saveTimeoutRef.current = null;
        }
      }, 400);
      saveTimeoutRef.current = timeout;
      return () => {
        clearTimeout(timeout);
        if (saveTimeoutRef.current === timeout) {
          saveTimeoutRef.current = null;
        }
      };
    }

    const handle = fileHandleRef.current;

    if (!handle) {
      clearPendingSave();
      if (tasks.length || projects.length) {
        setSaveState({ status: "unsynced" });
      } else {
        setSaveState({ status: "idle" });
      }
      return () => {};
    }

    if (snapshot === lastSavedRef.current) {
      clearPendingSave();
      setSaveState({ status: "saved" });
      return () => {};
    }

    clearPendingSave();
    setSaveState({ status: "dirty" });
    const timeout = setTimeout(async () => {
      setSaveState({ status: "saving" });
      try {
        await writeToHandle(handle, snapshot);
        lastSavedRef.current = snapshot;
        setSaveState({ status: "saved", timestamp: Date.now() });
      } catch (error) {
        console.error(error);
        setSaveState({ status: "error", error });
      } finally {
        saveTimeoutRef.current = null;
      }
    }, 600);
    saveTimeoutRef.current = timeout;

    return () => {
      clearTimeout(timeout);
      if (saveTimeoutRef.current === timeout) {
        saveTimeoutRef.current = null;
      }
    };
  }, [
    tasks,
    projects,
    isLocalStorageMode,
    buildSnapshot,
    writeToHandle,
    clearPendingSave
  ]);

  const updateTask = useCallback((index, mutator) => {
    setTasks((prev) => {
      const current = prev[index];
      if (!current) return prev;
      const draft = { ...current };
      const outcome = mutator(draft);
      if (!outcome) return prev;
      const nextTask = outcome === true ? draft : { ...draft, ...outcome };
      if (outcome !== true && typeof outcome === "object") {
        for (const [key, value] of Object.entries(outcome)) {
          if (value === undefined) {
            delete nextTask[key];
          }
        }
      }
      nextTask.updated = new Date().toISOString();
      const next = [...prev];
      next[index] = nextTask;
      return next;
    });
  }, []);

  const addProject = useCallback(
    (name) => {
      const result = addProjectHelper(projects, name);
      if (result.ok) {
        setProjects(result.projects);
      }
      return result;
    },
    [projects]
  );

  const renameProject = useCallback(
    (oldName, newName) => {
      const result = renameProjectHelper(projects, tasks, oldName, newName);
      if (result.ok) {
        setProjects(result.projects);
        if (result.tasks !== tasks) {
          setTasks(result.tasks);
        }
      }
      return result;
    },
    [projects, tasks]
  );

  const deleteProject = useCallback(
    (name) => {
      const result = deleteProjectHelper(projects, tasks, name);
      if (result.ok) {
        setProjects(result.projects);
        if (result.tasks !== tasks) {
          setTasks(result.tasks);
        }
      }
      return result;
    },
    [projects, tasks]
  );

  const handleInlineProjectCreate = useCallback(
    (name) => addProject(name),
    [addProject]
  );

  const handleOpenEditor = useCallback(
    (index) => {
      setEditingIndex(index);
      disclosure.onOpen();
    },
    [disclosure]
  );

  const handleToggleDone = useCallback(
    (index) => {
      updateTask(index, (draft) => {
        draft.done = !draft.done;
        return true;
      });
    },
    [updateTask]
  );

  const handleMatrixDrop = useCallback(
    (quadrant, rawIndex) => {
      const index = Number.parseInt(rawIndex, 10);
      if (Number.isNaN(index)) return;
      updateTask(index, (draft) => {
        switch (quadrant) {
          case "today":
            draft.urgency = 4;
            draft.importance = 4;
            break;
          case "schedule":
            draft.importance = 4;
            draft.urgency = 2;
            break;
          case "delegate":
            draft.urgency = 4;
            draft.importance = 1;
            break;
          case "consider":
            draft.urgency = 1;
            draft.importance = 1;
            break;
          default:
            return false;
        }
        return true;
      });
    },
    [updateTask]
  );

  const handleTaskTitleRename = useCallback(
    (index, nextTitle) => {
      const current = tasks[index];
      const result = prepareTaskTitleRename(current, nextTitle);
      if (!result.ok) {
        return result;
      }
      if (result.changed) {
        updateTask(index, () => ({ title: result.title }));
      }
      return { ok: true, name: result.title };
    },
    [tasks, updateTask]
  );

  const handleProjectDrop = useCallback(
    (projectName, rawIndex) => {
      const index = Number.parseInt(rawIndex, 10);
      if (Number.isNaN(index)) return;
      updateTask(index, (draft) => {
        const target = projectName ?? undefined;
        const current = draft.project ?? undefined;
        if (current === target) return false;
        return { project: target };
      });
    },
    [updateTask]
  );

  const handleEffortCommit = useCallback(
    (index, value) => {
      const clamped = Math.max(1, Math.min(10, Math.round(value)));
      updateTask(index, (draft) => {
        if (draft.effort === clamped) return false;
        return { effort: clamped };
      });
    },
    [updateTask]
  );

  const toggleMatrixFilter = useCallback((filter) => {
    setMatrixFilters((prev) => {
      if (filter === ALL_PROJECTS) {
        return DEFAULT_MATRIX_FILTERS;
      }
      const withoutAll = prev.filter((value) => value !== ALL_PROJECTS);
      const hasFilter = withoutAll.includes(filter);
      const next = hasFilter
        ? withoutAll.filter((value) => value !== filter)
        : [...withoutAll, filter];
      return next.length ? next : DEFAULT_MATRIX_FILTERS;
    });
  }, []);

  const handleMatrixSortChange = useCallback((mode) => {
    setMatrixSortMode((prev) => (prev === mode ? prev : mode));
  }, []);

  const handleCreateTask = useCallback(
    (draft) => {
      const result = createTaskPayload(draft);
      if (!result.ok) {
        return result;
      }
      setTasks((prev) => [...prev, result.task]);
      return { ok: true };
    },
    []
  );

  const openAssistantIo = useCallback(
    (tab = 0) => {
      setJsonTabIndex(tab);
      if (tab === 0) {
        const initial = parseJSONInput(jsonExportText);
        setJsonInputValue(jsonExportText);
        if (initial.ok) {
          setJsonParsed(initial);
          setJsonError("");
        } else {
          setJsonParsed(null);
          setJsonError(initial.error ?? "");
        }
      } else {
        setJsonInputValue("");
        setJsonParsed(null);
        setJsonError("");
      }
      jsonModal.onOpen();
    },
    [jsonExportText, jsonModal]
  );

  const handleJsonTabChange = useCallback(
    (index) => {
      setJsonTabIndex(index);
      if (index !== 1) {
        setJsonError("");
        return;
      }
      const result = parseJSONInput(jsonInputValue);
      if (result.ok) {
        setJsonParsed(result);
        setJsonError("");
      } else {
        setJsonParsed(null);
        setJsonError(result.error ?? "");
      }
    },
    [jsonInputValue]
  );

  const handleJsonInputChange = useCallback((event) => {
    const { value } = event.target;
    setJsonInputValue(value);
    const result = parseJSONInput(value);
    if (result.ok) {
      setJsonParsed(result);
      setJsonError("");
    } else {
      setJsonParsed(null);
      setJsonError(result.error ?? "");
    }
  }, []);

  const handleJsonSave = useCallback(async () => {
    if (!jsonParsed?.ok) return;
    setIsJsonSaving(true);
    const nextTasks = jsonParsed.tasks;
    const nextProjects = jsonParsed.projects;
    const snapshot = buildSnapshot(nextTasks, nextProjects);
    try {
      setTasks(nextTasks);
      setProjects(nextProjects);
      clearPendingSave();
      if (isLocalStorageMode) {
        lastSavedRef.current = "";
        setSaveState({ status: nextTasks.length || nextProjects.length ? "saving" : "idle" });
      } else {
        const handle = await ensureHandleForSave();
        if (handle) {
          setSaveState({ status: "saving" });
          await writeToHandle(handle, snapshot);
          lastSavedRef.current = snapshot;
          setSaveState({ status: "saved", timestamp: Date.now() });
        } else {
          lastSavedRef.current = snapshot;
          setSaveState({ status: nextTasks.length || nextProjects.length ? "unsynced" : "idle" });
        }
      }
      jsonModal.onClose();
    } catch (error) {
      console.error(error);
      setSaveState({ status: "error", error });
    } finally {
      setIsJsonSaving(false);
    }
  }, [
    jsonParsed,
    buildSnapshot,
    clearPendingSave,
    ensureHandleForSave,
    jsonModal,
    writeToHandle,
    isLocalStorageMode
  ]);

  const handleSaveEdit = useCallback(
    (changes) => {
      if (editingIndex == null) return;
      updateTask(editingIndex, () => ({ ...changes }));
      disclosure.onClose();
      setEditingIndex(null);
    },
    [editingIndex, updateTask, disclosure]
  );

  const handleCancelEdit = useCallback(() => {
    disclosure.onClose();
    setEditingIndex(null);
  }, [disclosure]);

  const handleStorageModeToggle = useCallback(
    (nextValue) => {
      if (nextValue) {
        fileHandleRef.current = null;
        lastSavedRef.current = "";
        if (tasks.length || projects.length) {
          hasLoadedStoredSnapshotRef.current = true;
        } else {
          hasLoadedStoredSnapshotRef.current = false;
        }
        setStorageMode(STORAGE_MODE_LOCAL);
      } else {
        hasLoadedStoredSnapshotRef.current = true;
        setStorageMode(STORAGE_MODE_FILE);
      }
    },
    [tasks, projects]
  );

  const handleLoadSample = useCallback(async () => {
    const sources = ["/tasks.json", "/tasks.sample.jsonl"];
    for (const path of sources) {
      try {
        const res = await fetch(path);
        if (!res.ok) continue;
        const text = await res.text();
        const parsed = parseJSONInput(text);
        if (!parsed.ok) continue;
        const { tasks: taskRecords, projects: projectList } = parsed;
        fileHandleRef.current = null;
        const snapshot = buildSnapshot(taskRecords, projectList);
        if (isLocalStorageMode) {
          lastSavedRef.current = "";
          setSaveState({ status: taskRecords.length || projectList.length ? "saving" : "idle" });
        } else {
          lastSavedRef.current = snapshot;
          setSaveState({ status: taskRecords.length || projectList.length ? "unsynced" : "idle" });
        }
        setProjects(projectList);
        setTasks(taskRecords);
        setShowDemoBanner(false);
        return;
      } catch (error) {
        console.error(error);
      }
    }
    alert("Unable to load sample tasks.json");
  }, [buildSnapshot, isLocalStorageMode]);

  const handleOpenFile = useCallback(async () => {
    if (!window.showOpenFilePicker) {
      alert("Use a Chromium browser for File System Access support");
      return;
    }
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JSONL", accept: { "text/plain": [".jsonl"] } }]
    });
    fileHandleRef.current = handle;
    setStorageMode(STORAGE_MODE_FILE);
    const file = await handle.getFile();
    const text = await file.text();
    const parsed = parseJSONInput(text);
    if (!parsed.ok) {
      alert(parsed.error ?? "Unable to parse JSON");
      return;
    }
    const { tasks: taskRecords, projects: projectList } = parsed;
    lastSavedRef.current = buildSnapshot(taskRecords, projectList);
    setProjects(projectList);
    setTasks(taskRecords);
    setSaveState({ status: "saved", timestamp: Date.now() });
  }, []);

  const handleSaveFile = useCallback(async () => {
    const handle = await ensureHandleForSave();
    if (!handle) return;
    clearPendingSave();
    const snapshot = buildSnapshot(tasks, projects);
    setSaveState({ status: "saving" });
    try {
      await writeToHandle(handle, snapshot);
      saveTimeoutRef.current = null;
      lastSavedRef.current = snapshot;
      setSaveState({ status: "saved", timestamp: Date.now() });
    } catch (error) {
      console.error(error);
      setSaveState({ status: "error", error });
    }
  }, [tasks, projects, ensureHandleForSave, clearPendingSave, writeToHandle, buildSnapshot]);

  const editingTask = editingIndex != null ? tasks[editingIndex] : null;

  useEffect(() => () => clearPendingSave(), [clearPendingSave]);

  return (
    <Container maxW="7xl" py={10}>
      <Stack spacing={10}>
        <DemoDataBanner
          isVisible={showDemoBanner}
          onLoadDemo={handleLoadSample}
          onDismiss={() => setShowDemoBanner(false)}
        />
        <WorkspaceHeader
          onAddTask={addTaskDisclosure.onOpen}
          onOpenFile={handleOpenFile}
          onAssistantTab={openAssistantIo}
          saveState={saveState}
          onSave={isLocalStorageMode ? undefined : handleSaveFile}
          isLocalStorageEnabled={isLocalStorageMode}
          onToggleLocalStorage={handleStorageModeToggle}
        />
        <Tabs
          index={workspaceTabIndex}
          onChange={setWorkspaceTabIndex}
          variant="enclosed"
          colorScheme="purple"
          isLazy
        >
          <Stack spacing={4}>
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "flex-start", md: "center" }}
              justify="space-between"
              gap={{ base: 3, md: 6 }}
            >
              <TabList flexWrap="wrap" columnGap={2} rowGap={2}>
                <Tab fontWeight="semibold" _selected={{ fontWeight: "bold", color: "purple.600" }}>
                  Priority
                </Tab>
                <Tab fontWeight="semibold" _selected={{ fontWeight: "bold", color: "purple.600" }}>
                  Projects
                </Tab>
              </TabList>
              <Box flexShrink={0} alignSelf={{ base: "flex-start", md: "center" }}>
                <MatrixSortControl value={matrixSortMode} onChange={handleMatrixSortChange} />
              </Box>
            </Flex>
            <TabPanels>
              <TabPanel px={0} pt={0} pb={0}>
                <Stack spacing={4}>
                  <GlobalToolbar
                    filterOptions={matrixFilterOptions}
                    activeFilters={matrixFilters}
                    onToggleFilter={toggleMatrixFilter}
                  />
                  <Box
                    maxH={{ base: "none", lg: "70vh" }}
                    overflowY={{ base: "visible", lg: "auto" }}
                    pr={{ lg: 2 }}
                  >
                    <PriorityMatrixSection
                      matrix={matrix}
                      sortMode={matrixSortMode}
                      onEditTask={handleOpenEditor}
                      onToggleTask={handleToggleDone}
                      onDropTask={handleMatrixDrop}
                      onEffortChange={handleEffortCommit}
                      onAddTask={addTaskDisclosure.onOpen}
                      onLoadDemo={handleLoadSample}
                      onRenameTask={handleTaskTitleRename}
                    />
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel px={0} pt={0}>
                <ProjectsPanel
                  projectGroups={projectGroups}
                  onManageProjects={projectManagerDisclosure.onOpen}
                  onAddTask={addTaskDisclosure.onOpen}
                  onRenameProject={renameProject}
                  onRenameTask={handleTaskTitleRename}
                  onEditTask={handleOpenEditor}
                  onToggleTask={handleToggleDone}
                  onDropProject={handleProjectDrop}
                  onEffortChange={handleEffortCommit}
                  highlightMode={matrixSortMode}
                />
              </TabPanel>
            </TabPanels>
          </Stack>
        </Tabs>
      </Stack>
      <ProjectManagerModal
        isOpen={projectManagerDisclosure.isOpen}
        onClose={projectManagerDisclosure.onClose}
        projects={projects}
        usage={projectUsage}
        onAdd={addProject}
        onRename={renameProject}
        onDelete={deleteProject}
      />
      {editingTask ? (
        <TaskEditor
          task={editingTask}
          isOpen={disclosure.isOpen}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
          projects={projects}
          onCreateProject={handleInlineProjectCreate}
        />
      ) : null}
      <AddTaskModal
        isOpen={addTaskDisclosure.isOpen}
        onClose={addTaskDisclosure.onClose}
        onCreate={handleCreateTask}
        projects={projects}
        onCreateProject={handleInlineProjectCreate}
      />
      <AssistantWorkflowModal
        isOpen={jsonModal.isOpen}
        onClose={jsonModal.onClose}
        tabIndex={jsonTabIndex}
        onTabChange={handleJsonTabChange}
        exportText={jsonExportText}
        onCopyExport={clipboard.onCopy}
        hasCopiedExport={clipboard.hasCopied}
        inputValue={jsonInputValue}
        onInputChange={handleJsonInputChange}
        error={jsonError}
        canSave={canSaveJson}
        onSave={handleJsonSave}
        isSaving={isJsonSaving}
      />
    </Container>
  );
}
