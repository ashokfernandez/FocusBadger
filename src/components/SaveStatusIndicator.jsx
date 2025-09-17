import { useMemo } from "react";
import { Badge, Button, HStack, Spinner, Text } from "@chakra-ui/react";
import { CheckCircleIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionBadge = motion(Badge);

function SaveCallToAction({ label, variant = "outline", onClick }) {
  if (!onClick) return null;
  return (
    <Button size="xs" variant={variant} onClick={onClick}>
      {label}
    </Button>
  );
}

function useIndicatorContent(state) {
  return useMemo(() => {
    switch (state.status) {
      case "saving":
        return {
          type: "saving",
          content: (
            <HStack spacing={2} color="blue.500" fontSize="sm">
              <Spinner size="sm" />
              <Text>Saving…</Text>
            </HStack>
          )
        };
      case "saved":
        return {
          type: "saved",
          content: (
            <HStack spacing={3} align="center">
              <MotionBadge
                colorScheme="green"
                variant="subtle"
                fontSize="xs"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                display="inline-flex"
                alignItems="center"
                gap={1}
              >
                <CheckCircleIcon /> Saved
              </MotionBadge>
            </HStack>
          )
        };
      case "dirty":
        return {
          type: "dirty",
          content: (
            <HStack spacing={3} align="center">
              <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                Unsaved changes
              </Badge>
            </HStack>
          ),
          action: { label: "Save now", variant: "solid" }
        };
      case "unsynced":
        return {
          type: "unsynced",
          content: (
            <HStack spacing={3} align="center">
              <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                Unsynced changes
              </Badge>
            </HStack>
          ),
          action: { label: "Save", variant: "outline" }
        };
      case "error":
        return {
          type: "error",
          content: (
            <HStack spacing={2} color="red.500" fontSize="sm">
              <WarningTwoIcon />
              <Text>Save failed</Text>
            </HStack>
          )
        };
      default:
        return {
          type: "idle",
          content: (
            <HStack spacing={3} align="center">
              <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                Ready
              </Badge>
            </HStack>
          ),
          action: { label: "Save now", variant: "outline" }
        };
    }
  }, [state.status]);
}

export default function SaveStatusIndicator({ state, onSave }) {
  const { content, action } = useIndicatorContent(state ?? { status: "idle" });
  const showAction = action && onSave;

  return (
    <HStack spacing={3} align="center">
      {content}
      {showAction ? <SaveCallToAction {...action} onClick={onSave} /> : null}
    </HStack>
  );
}

export { useIndicatorContent };
