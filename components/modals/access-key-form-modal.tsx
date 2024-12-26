import { UseDisclosureReturn } from "@nextui-org/use-disclosure";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import React, { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { DatePicker, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@nextui-org/react";
import { useForm } from "react-hook-form";
import { AccessKey } from "@prisma/client";
import { parseAbsolute } from "@internationalized/date";

import { DataLimitUnit, EditAccessKeyRequest, NewAccessKeyRequest } from "@/core/definitions";
import { createAccessKey, updateAccessKey } from "@/core/actions/access-key";

interface Props {
    disclosure: UseDisclosureReturn;
    serverId: number;
    accessKeyData?: AccessKey;
}

export default function AccessKeyFormModal({ disclosure, serverId, accessKeyData }: Props) {
    const form = useForm<NewAccessKeyRequest | EditAccessKeyRequest>();

    const [selectedDataLimitUnit, setSelectedDataLimitUnit] = useState<string>(DataLimitUnit.Bytes);

    const actualSubmit = async (data: NewAccessKeyRequest | EditAccessKeyRequest) => {
        data.serverId ??= serverId;
        data.dataLimitUnit ??= DataLimitUnit.Bytes;

        if (accessKeyData) {
            const updateData = data as EditAccessKeyRequest;

            updateData.id = accessKeyData.id;
            await updateAccessKey(updateData);
        } else {
            await createAccessKey(data);
        }

        disclosure.onClose();
    };

    useEffect(() => {
        form.setValue("dataLimitUnit", selectedDataLimitUnit as DataLimitUnit, { shouldDirty: true });
    }, [selectedDataLimitUnit]);

    useEffect(() => {
        if (disclosure.isOpen) {
            if (accessKeyData) {
                form.reset({
                    serverId: accessKeyData.serverId,
                    name: accessKeyData.name,
                    dataLimit: accessKeyData.dataLimit,
                    dataLimitUnit: accessKeyData.dataLimitUnit as DataLimitUnit,
                    expiresAt: accessKeyData.expiresAt
                });

                setSelectedDataLimitUnit(accessKeyData.dataLimitUnit);
            } else {
                form.reset();
                form.setValue("dataLimitUnit", DataLimitUnit.Bytes);
            }
        }
    }, [disclosure.isOpen]);

    return (
        <Modal isOpen={disclosure.isOpen} onOpenChange={disclosure.onOpenChange}>
            <ModalContent>
                <ModalHeader>{accessKeyData ? `Access Key "${accessKeyData.name}"` : "New Access Key"}</ModalHeader>
                <ModalBody>
                    <form className="grid gap-4" id="accessKeyForm" onSubmit={form.handleSubmit(actualSubmit)}>
                        <Input
                            isInvalid={!!form.formState.errors.name}
                            isRequired={true}
                            label="Access key name"
                            size="sm"
                            variant="faded"
                            {...form.register("name", {
                                required: true,
                                maxLength: 64
                            })}
                        />

                        <div className="flex gap-2">
                            <Input
                                isInvalid={!!form.formState.errors.dataLimit}
                                label="Data limit"
                                size="sm"
                                type="number"
                                variant="faded"
                                {...form.register("dataLimit", {
                                    required: false,
                                    min: 0,
                                    max: 1_000_000_000_000_000,
                                    setValueAs: (v) => parseInt(v)
                                })}
                            />

                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        className="bg-default-100 text-sm"
                                        radius="sm"
                                        size="lg"
                                        type="button"
                                        variant="ghost"
                                    >
                                        {selectedDataLimitUnit}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    defaultSelectedKeys={new Set([selectedDataLimitUnit])}
                                    selectionMode="single"
                                    variant="flat"
                                    onSelectionChange={(v) => setSelectedDataLimitUnit(v.currentKey!)}
                                >
                                    <DropdownItem key={DataLimitUnit.Bytes}>{DataLimitUnit.Bytes}</DropdownItem>
                                    <DropdownItem key={DataLimitUnit.KB}>{DataLimitUnit.KB}</DropdownItem>
                                    <DropdownItem key={DataLimitUnit.MB}>{DataLimitUnit.MB}</DropdownItem>
                                    <DropdownItem key={DataLimitUnit.GB}>{DataLimitUnit.GB}</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>

                        <DatePicker
                            showMonthAndYearPickers
                            hideTimeZone={true}
                            label="Expiration date"
                            minValue={parseAbsolute(new Date().toISOString(), "UTC")}
                            size="sm"
                            variant="faded"
                            onChange={(v) => {
                                form.setValue("expiresAt", v.toDate("UTC"));
                            }}
                        />
                    </form>
                </ModalBody>
                <ModalFooter className="flex justify-between gap-2 mt-4">
                    <Button variant="flat" onClick={disclosure.onClose}>
                        Cancel
                    </Button>

                    <Button
                        color="primary"
                        form="accessKeyForm"
                        isLoading={form.formState.isSubmitting || form.formState.isSubmitSuccessful}
                        type="submit"
                        variant="shadow"
                    >
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
