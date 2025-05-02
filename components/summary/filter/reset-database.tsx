"use client";
import { useDisclosure } from "@nextui-org/react";

import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";
import { useState } from "react";

export const ResetDatabase = (props: {
  hidden?: boolean;
  resetDatabase: () => any;
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [resetting, setResetting] = useState(false);

  function reset() {
    setResetting(true);
    props.resetDatabase();
  }

  if (props.hidden) {
    return <></>;
  }

  return (
    <>
      <Button
        aria-label="Reset Database"
        className="my-4 md:mr-4"
        color="warning"
        onPress={onOpen}
      >
        Reset Database
      </Button>
      <Modal
        backdrop="blur"
        hideCloseButton={resetting}
        isDismissable={!resetting}
        isKeyboardDismissDisabled={resetting}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>⚠ Reset Database</ModalHeader>
              <ModalBody>
                <p>
                  Resetting the database will clear the data the P&L tool stores
                  in your browser. Reloading all transactions again may take a
                  while if you have a lot of transactions in your wallet. You
                  should only reset the data as a last resort, if there appears
                  to be a problem with the P&L data.
                </p>
                <p>
                  <Button
                    aria-label="Cancel"
                    className={!resetting ? "my-4 md:mr-4" : "hidden"}
                    isDisabled={resetting}
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    aria-label="⚠ Reset Database"
                    className="my-4 md:mr-4"
                    color="warning"
                    isDisabled={resetting}
                    isLoading={resetting}
                    onPress={reset}
                  >
                    {resetting ? "Resetting database... " : "Reset Database"}
                  </Button>
                </p>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
