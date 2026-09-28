import { useKeyboardShortcutMenu } from '@/keyboard-shortcut-menu/hooks/useKeyboardShortcutMenu';
import { SIDE_PANEL_FOCUS_ID } from '@/side-panel/constants/SidePanelFocusId';
import { useHandleSidePanelEscape } from '@/side-panel/hooks/useHandleSidePanelEscape';
import { useOpenAskAiPageInSidePanel } from '@/side-panel/hooks/useOpenAskAiPageInSidePanel';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { useGlobalHotkeys } from '@/ui/utilities/hotkey/hooks/useGlobalHotkeys';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { Key } from 'ts-key-enum';

export const useCommandMenuHotKeys = () => {
  const { closeSidePanelMenu } = useSidePanelMenu();

  const isSidePanelOpened = useAtomStateValue(isSidePanelOpenedState);

  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();

  const { openAskAiPage } = useOpenAskAiPageInSidePanel();

  const handleSidePanelEscape = useHandleSidePanelEscape();

  const { closeKeyboardShortcutMenu } = useKeyboardShortcutMenu();

  useGlobalHotkeys({
    keys: ['ctrl+k', 'meta+k'],
    callback: () => {
      closeKeyboardShortcutMenu();

      if (isSidePanelOpened) {
        closeSidePanelMenu();

        return;
      }

      openRecordsSearchPage();
    },
    containsModifier: true,
    dependencies: [
      closeKeyboardShortcutMenu,
      closeSidePanelMenu,
      isSidePanelOpened,
      openRecordsSearchPage,
    ],
  });

  useGlobalHotkeys({
    keys: ['/'],
    callback: () => {
      openRecordsSearchPage();
    },
    containsModifier: false,
    dependencies: [openRecordsSearchPage],
    options: {
      ignoreModifiers: true,
    },
  });

  useGlobalHotkeys({
    keys: ['@'],
    callback: () => {
      openAskAiPage({ resetNavigationStack: true });
    },
    containsModifier: false,
    dependencies: [openAskAiPage],
    options: {
      ignoreModifiers: true,
    },
  });

  useHotkeysOnFocusedElement({
    keys: [Key.Escape],
    callback: () => {
      handleSidePanelEscape();
    },
    focusId: SIDE_PANEL_FOCUS_ID,
    dependencies: [handleSidePanelEscape],
    options: {
      enableOnFormTags: false,
    },
  });
};
