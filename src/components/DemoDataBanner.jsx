import { Alert, AlertIcon, Box, Button, CloseButton, Text } from "@chakra-ui/react";

export default function DemoDataBanner({ isVisible, onLoadDemo, onDismiss }) {
  if (!isVisible) {
    return null;
  }

  return (
    <Alert status="info" variant="left-accent" borderRadius="xl" alignItems="center">
      <AlertIcon />
      <Box flex="1">
        <Text fontWeight="medium">Exploring FocusBadger online?</Text>
        <Text fontSize="sm" color="gray.700">
          Load demo data to try the workspace without linking a local file. You can dismiss this banner after loading.
        </Text>
      </Box>
      <Button size="sm" colorScheme="purple" onClick={onLoadDemo} mr={2}>
        Load demo data
      </Button>
      <CloseButton position="static" onClick={onDismiss} />
    </Alert>
  );
}
