import React, { useState, useEffect } from "react";
import { Factory } from "rosie";
import { render, wait } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { StubResourceRecord } from "../tests/stubs/stub-resource-record";
import { ServiceHookFactory } from "./service-hook-factory";
import mockAxios from "../tests/mocks/mock-axios";
import { FactoryType } from "../tests/factories/factory-type";
import { TestUtils } from "../tests/test-utils";

// ---------------------------------------------------------------------------------------------
// #region Variables
// ---------------------------------------------------------------------------------------------

const baseEndpoint = "records";
const cancellationTestsApiDelay = 10;
const cancellationTestsAssertionDelay = 20;
const resourceEndpoint = `${baseEndpoint}/:id`;
const nestedBaseEndpoint = `nested/:nestedId/${baseEndpoint}`;

// #endregion Variables

// ---------------------------------------------------------------------------------------------
// #region Stubs
// ---------------------------------------------------------------------------------------------

interface StubNestedParams {
    nestedId: number;
}

// #endregion Stubs

// ---------------------------------------------------------------------------------------------
// #region Functions
// ---------------------------------------------------------------------------------------------

const itReturnsFunction = (func: Function, endpoint: string) => {
    it("returns function", () => {
        expect(func(StubResourceRecord, endpoint)).toBeInstanceOf(Function);
    });
};

// #endregion Functions

// ---------------------------------------------------------------------------------------------
// #region Tests
// ---------------------------------------------------------------------------------------------

describe("ServiceHookFactory", () => {
    const sut = ServiceHookFactory;

    // ---------------------------------------------------------------------------------------------
    // #region useCreate
    // ---------------------------------------------------------------------------------------------

    describe("useCreate", () => {
        itReturnsFunction(sut.useCreate, baseEndpoint);

        it("when not-cancelled, resolves successfully", async () => {
            // Arrange
            const useCreate = sut.useCreate<StubResourceRecord>(
                StubResourceRecord,
                baseEndpoint
            );
            const expectedStubRecord = Factory.build<StubResourceRecord>(
                FactoryType.StubResourceRecord
            );
            mockAxios.postSuccess(expectedStubRecord);

            const CreateStubComponent = () => {
                const { create } = useCreate();
                const [record, setRecord] = useState<StubResourceRecord>(
                    null as any
                );

                useEffect(() => {
                    async function createRecord() {
                        const result = await create(new StubResourceRecord());
                        setRecord(result.resultObject!);
                    }

                    createRecord();
                }, []);

                return <div>{record != null && record!.name}</div>;
            };

            // Act
            const { getByText } = render(<CreateStubComponent />);

            // Assert
            await wait(() => {
                expect(getByText(expectedStubRecord.name!)).toBeInTheDocument();
            });
        });

        /**
         * Test ensures service hook factory in fact protects against a react error
         * when the component is unmounted before the promise resolves.
         *
         * See ServiceFactory.test.tsx for test that verifies react error thrown
         */
        it("when unmounted before resolution, promise is cancelled successfully", async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, "error");

            const useCreate = sut.useCreate<StubResourceRecord>(
                StubResourceRecord,
                baseEndpoint
            );

            const record = Factory.build<StubResourceRecord>(
                FactoryType.StubResourceRecord
            );
            mockAxios.postSuccess(record, cancellationTestsApiDelay);

            let isUnmounted = false;

            const CreateStubComponent = () => {
                const { create } = useCreate();
                const [record, setRecord] = useState<StubResourceRecord>(
                    null as any
                );

                useEffect(() => {
                    async function createRecord() {
                        const result = await create(new StubResourceRecord());
                        setRecord(result.resultObject!);
                    }

                    createRecord();

                    return () => {
                        isUnmounted = true;
                    };
                }, []);

                return <div>{record != null && record!.name}</div>;
            };

            // Act
            await act(async () => {
                const { unmount } = render(<CreateStubComponent />);
                unmount();
                // Force a sleep longer than when API promise resolves
                await TestUtils.sleep(cancellationTestsAssertionDelay);
            });

            // Assert
            expect(isUnmounted).toBeTrue();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    // #endregion useCreate

    // ---------------------------------------------------------------------------------------------
    // #region useDelete
    // ---------------------------------------------------------------------------------------------

    describe("useDelete", () => {
        itReturnsFunction(sut.useDelete, baseEndpoint);

        it("when not-cancelled, resolves successfully", async () => {
            // Arrange
            const useDelete = sut.useDelete(resourceEndpoint);
            const recordIdToDelete = 10;

            mockAxios.deleteSuccess(new Boolean(true));

            const DeleteStubComponent = () => {
                const { delete: deleteRecord } = useDelete();
                const [isDeleted, setIsDeleted] = useState<boolean>(false);

                useEffect(() => {
                    async function deleteStubRecord() {
                        try {
                            const deleteResult = await deleteRecord(
                                recordIdToDelete
                            );
                            setIsDeleted(
                                (deleteResult.resultObject || false) as boolean
                            );
                        } catch (e) {}
                    }
                    deleteStubRecord();
                }, []);

                return <div>{isDeleted && "deleted"}</div>;
            };

            // Act
            const { getByText } = render(<DeleteStubComponent />);

            // Assert
            await wait(() => {
                expect(getByText("deleted")).toBeInTheDocument();
            });
        });

        /**
         * Test ensures service hook factory in fact protects against a react error
         * when the component is unmounted before the promise resolves.
         *
         * See ServiceFactory.test.tsx for test that verifies react error thrown
         */
        it("when unmounted before resolution, promise is cancelled successfully", async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, "error");

            const useDelete = sut.useDelete(baseEndpoint);
            const record = Factory.build<StubResourceRecord>(
                FactoryType.StubResourceRecord,
                {
                    id: 10,
                }
            );
            mockAxios.deleteSuccess(record, cancellationTestsApiDelay);
            let isUnmounted = false;

            const DeleteStubComponent = () => {
                const { delete: deleteRecord } = useDelete();
                const [record, setRecord] = useState<StubResourceRecord>(
                    new StubResourceRecord()
                );

                useEffect(() => {
                    async function deleteStubRecord() {
                        await deleteRecord(record.id);
                        setRecord(record);
                    }

                    deleteStubRecord();

                    return () => {
                        isUnmounted = true;
                    };
                }, []);

                return <div>{record != null && record!.id}</div>;
            };

            // Act
            await act(async () => {
                const { unmount } = render(<DeleteStubComponent />);
                unmount();
                // Force a sleep longer than when API promise resolves
                await TestUtils.sleep(cancellationTestsAssertionDelay);
            });

            // Assert
            expect(isUnmounted).toBeTrue();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    // #endregion useDelete

    // // ---------------------------------------------------------------------------------------------
    // // #region useGet
    // // ---------------------------------------------------------------------------------------------

    // describe("useGet", () => {
    //     itReturnsFunction(sut.useGet, baseEndpoint);

    //     it("when not-cancelled, resolves successfully", async () => {
    //         // Arrange
    //         const useGet = sut.useGet(StubResourceRecord, resourceEndpoint);
    //         const expectedStubRecord = Factory.build<StubResourceRecord>(
    //             FactoryType.StubResourceRecord,
    //             { id: 10 }
    //         );

    //         mockAxios.getSuccess(expectedStubRecord);

    //         const GetStubComponent = () => {
    //             const { get } = useGet();
    //             const [record, setRecord] = useState<StubResourceRecord>(null as any);

    //             useEffect(() => {
    //                 async function getUser() {
    //                     try {
    //                         const result = await get({
    //                             id: expectedStubRecord.id!,
    //                         });
    //                         setRecord(result.resultObject!);
    //                     } catch (e) {}
    //                 }

    //                 getUser();
    //             }, []);

    //             return <div>{record != null && record.name}</div>;
    //         };

    //         // Act
    //         const { getByText } = render(<GetStubComponent />);

    //         // Assert
    //         await wait(() => {
    //             expect(
    //                 getByText(expectedStubRecord.name!)
    //             ).toBeInTheDocument();
    //         });
    //     });

    //     /**
    //      * Test ensures service hook factory in fact protects against a react error
    //      * when the component is unmounted before the promise resolves.
    //      *
    //      * See ServiceFactory.test.tsx for test that verifies react error thrown
    //      */
    //     it("when unmounted before resolution, promise is cancelled successfully", async () => {
    //         // Arrange
    //         const consoleErrorSpy = jest.spyOn(console, "error");

    //         const useGet = sut.useGet(StubResourceRecord, baseEndpoint);
    //         const record = Factory.build<StubResourceRecord>(FactoryType.recordRecord, {
    //             id: 10,
    //         });
    //         mockAxios.getSuccess(record, cancellationTestsApiDelay);
    //         let isUnmounted = false;

    //         const GetStubComponent = () => {
    //             const { get } = useGet();
    //             const [record, setRecord] = useState<StubResourceRecord>(null as any);

    //             useEffect(() => {
    //                 async function getUser() {
    //                     const result = await get(record.id!);
    //                     setRecord(result.resultObject!);
    //                 }

    //                 getUser();

    //                 return () => {
    //                     isUnmounted = true;
    //                 };
    //             }, []);

    //             return <div>{record != null && record!.name}</div>;
    //         };

    //         // Act
    //         await act(async () => {
    //             const { unmount } = render(<GetStubComponent />);
    //             unmount();
    //             // Force a sleep longer than when API promise resolves
    //             await CoreUtils.sleep(cancellationTestsAssertionDelay);
    //         });

    //         // Assert
    //         expect(isUnmounted).toBeTrue();
    //         expect(consoleErrorSpy).not.toHaveBeenCalled();
    //     });
    // });

    // // #endregion useGet

    // // ---------------------------------------------------------------------------------------------
    // // #region useList
    // // ---------------------------------------------------------------------------------------------

    // describe("useList", () => {
    //     itReturnsFunction(sut.useList, baseEndpoint);

    //     it("when not-cancelled, resolves successfully", async () => {
    //         // Arrange
    //         const useList = sut.useList(StubResourceRecord, baseEndpoint);
    //         const expectedStubRecords = Factory.buildList(
    //             FactoryType.recordRecord,
    //             2
    //         ) as UserRecord[];

    //         mockAxios.listSuccess(expectedStubRecords);

    //         const ListStubComponent = () => {
    //             const { list } = useList();
    //             const [records, setRecords] = useState<UserRecord[]>([]);

    //             useEffect(() => {
    //                 async function listUsers() {
    //                     try {
    //                         const result = await list();
    //                         setRecords(result.resultObjects!);
    //                     } catch (e) {}
    //                 }
    //                 listUsers();
    //             }, []);

    //             return <div>{records != null && records.map((u) => u.name!)}</div>;
    //         };

    //         // Act
    //         const { getByText } = render(<ListStubComponent />);

    //         // Assert
    //         await wait(() => {
    //             expectedStubRecords.forEach((expected) => {
    //                 expect(
    //                     getByText(expected.name!, { exact: false })
    //                 ).toBeInTheDocument();
    //             });
    //         });
    //     });

    //     /**
    //      * Test ensures service hook factory in fact protects against a react error
    //      * when the component is unmounted before the promise resolves.
    //      *
    //      * See ServiceFactory.test.tsx for test that verifies react error thrown
    //      */
    //     it("when unmounted before resolution, promise is cancelled successfully", async () => {
    //         // Arrange
    //         const consoleErrorSpy = jest.spyOn(console, "error");

    //         const useList = sut.useList(UserRecord, baseEndpoint);
    //         const record = Factory.build<StubResourceRecord>(FactoryType.recordRecord, {
    //             id: 10,
    //         });
    //         mockAxios.getSuccess(record, cancellationTestsApiDelay);
    //         let isUnmounted = false;

    //         const ListStubComponent = () => {
    //             const { list } = useList();
    //             const [records, setRecords] = useState<UserRecord[]>([]);

    //             useEffect(() => {
    //                 async function listUsers() {
    //                     const result = await list();
    //                     setRecords(result.resultObjects!);
    //                 }

    //                 listUsers();

    //                 return () => {
    //                     isUnmounted = true;
    //                 };
    //             }, []);

    //             return <div>{records != null && records.map((u) => u.name!)}</div>;
    //         };

    //         // Act
    //         await act(async () => {
    //             const { unmount } = render(<ListStubComponent />);
    //             unmount();
    //             // Force a sleep longer than when API promise resolves
    //             await CoreUtils.sleep(cancellationTestsAssertionDelay);
    //         });

    //         // Assert
    //         expect(isUnmounted).toBeTrue();
    //         expect(consoleErrorSpy).not.toHaveBeenCalled();
    //     });
    // });

    // // #endregion useList

    // // ---------------------------------------------------------------------------------------------
    // // #region useNestedCreate
    // // ---------------------------------------------------------------------------------------------

    // describe("useNestedCreate", () => {
    //     itReturnsFunction(sut.useNestedCreate, nestedBaseEndpoint);

    //     it("when not-cancelled, resolves successfully", async () => {
    //         // Arrange
    //         const useCreate = sut.useNestedCreate<UserRecord, StubNestedParams>(
    //             UserRecord,
    //             nestedBaseEndpoint
    //         );
    //         const expectedStubRecord = Factory.build<StubResourceRecord>(
    //             FactoryType.recordRecord
    //         );

    //         mockAxios.postSuccess(expectedStubRecord);

    //         const NestedCreateStubComponent = () => {
    //             const { create } = useCreate();
    //             const [record, setRecord] = useState<StubResourceRecord>(null as any);

    //             useEffect(() => {
    //                 async function createLogin() {
    //                     const result = await create(new StubResourceRecord(), {
    //                         nestedId: 10,
    //                     });
    //                     setRecord(result.resultObject!);
    //                 }
    //                 createLogin();
    //             }, []);

    //             return <div>{record != null && record!.name}</div>;
    //         };

    //         // Act
    //         const { getByText } = render(<NestedCreateStubComponent />);

    //         // Assert
    //         await wait(() => {
    //             expect(
    //                 getByText(expectedStubRecord.name!)
    //             ).toBeInTheDocument();
    //         });
    //     });

    //     /**
    //      * Test ensures service hook factory in fact protects against a react error
    //      * when the component is unmounted before the promise resolves.
    //      *
    //      * See ServiceFactory.test.tsx for test that verifies react error thrown
    //      */
    //     it("when unmounted before resolution, promise is cancelled successfully", async () => {
    //         // Arrange
    //         const consoleErrorSpy = jest.spyOn(console, "error");

    //         const useCreate = sut.useNestedCreate<UserRecord, StubNestedParams>(
    //             UserRecord,
    //             nestedBaseEndpoint
    //         );
    //         const record = Factory.build<StubResourceRecord>(FactoryType.recordRecord);

    //         mockAxios.postSuccess(record, cancellationTestsApiDelay);

    //         let isUnmounted = false;

    //         const NestedCreateStubComponent = () => {
    //             const { create } = useCreate();
    //             const [record, setRecord] = useState<StubResourceRecord>(null as any);

    //             useEffect(() => {
    //                 async function createRecord() {
    //                     const result = await create(new StubResourceRecord(), {
    //                         nestedId: 10,
    //                     });
    //                     setRecord(result.resultObject!);
    //                 }

    //                 createRecord();

    //                 return () => {
    //                     isUnmounted = true;
    //                 };
    //             }, []);

    //             return <div>{record != null && record.name!}</div>;
    //         };

    //         // Act
    //         await act(async () => {
    //             const { unmount } = render(<NestedCreateStubComponent />);
    //             unmount();
    //             // Force a sleep longer than when API promise resolves
    //             await CoreUtils.sleep(cancellationTestsAssertionDelay);
    //         });

    //         // Assert
    //         expect(isUnmounted).toBeTrue();
    //         expect(consoleErrorSpy).not.toHaveBeenCalled();
    //     });
    // });

    // // #endregion useNestedCreate

    // // ---------------------------------------------------------------------------------------------
    // // #region useNestedList
    // // ---------------------------------------------------------------------------------------------

    // describe("useNestedList", () => {
    //     itReturnsFunction(sut.useNestedList, nestedBaseEndpoint);

    //     it("when not-cancelled, resolves successfully", async () => {
    //         // Arrange
    //         const useList = sut.useNestedList<UserRecord, StubNestedParams, {}>(
    //             UserRecord,
    //             nestedBaseEndpoint
    //         );
    //         const expectedStubRecords = Factory.buildList(
    //             FactoryType.recordRecord,
    //             2
    //         ) as UserRecord[];

    //         mockAxios.listSuccess(expectedStubRecords);

    //         const NestedListStubComponent = () => {
    //             const { list } = useList();
    //             const [records, setRecords] = useState<UserRecord[]>([]);

    //             useEffect(() => {
    //                 async function getUsers() {
    //                     const result = await list({
    //                         nestedId: 10,
    //                     });
    //                     setRecords(result.resultObjects!);
    //                 }
    //                 getUsers();
    //             }, []);

    //             return <div>{records != null && records.map((u) => u.name!)}</div>;
    //         };

    //         // Act
    //         const { getByText } = render(<NestedListStubComponent />);

    //         // Assert
    //         await wait(() => {
    //             expectedStubRecords.forEach((expected) => {
    //                 expect(
    //                     getByText(expected.name!, { exact: false })
    //                 ).toBeInTheDocument();
    //             });
    //         });
    //     });

    //     /**
    //      * Test ensures service hook factory in fact protects against a react error
    //      * when the component is unmounted before the promise resolves.
    //      *
    //      * See ServiceFactory.test.tsx for test that verifies react error thrown
    //      */
    //     it("when unmounted before resolution, promise is cancelled successfully", async () => {
    //         // Arrange
    //         const consoleErrorSpy = jest.spyOn(console, "error");

    //         const useList = sut.useNestedList<UserRecord, StubNestedParams, {}>(
    //             UserRecord,
    //             nestedBaseEndpoint
    //         );
    //         const records = Factory.buildList(
    //             FactoryType.recordRecord,
    //             2
    //         ) as UserRecord[];

    //         mockAxios.getSuccess(records, cancellationTestsApiDelay);

    //         let isUnmounted = false;

    //         const NestedListStubComponent = () => {
    //             const { list } = useList();
    //             const [records, setRecords] = useState<UserRecord[]>([]);

    //             useEffect(() => {
    //                 async function listUsers() {
    //                     const result = await list({ nestedId: 10 });
    //                     setRecords(result.resultObjects!);
    //                 }

    //                 listUsers();

    //                 return () => {
    //                     isUnmounted = true;
    //                 };
    //             }, []);

    //             return <div>{records != null && records.map((u) => u.name!)}</div>;
    //         };

    //         // Act
    //         await act(async () => {
    //             const { unmount } = render(<NestedListStubComponent />);
    //             unmount();
    //             // Force a sleep longer than when API promise resolves
    //             await CoreUtils.sleep(cancellationTestsAssertionDelay);
    //         });

    //         // Assert
    //         expect(isUnmounted).toBeTrue();
    //         expect(consoleErrorSpy).not.toHaveBeenCalled();
    //     });
    // });

    // // #endregion useNestedList

    // // ---------------------------------------------------------------------------------------------
    // // #region useUpdate
    // // ---------------------------------------------------------------------------------------------

    // describe("useUpdate", () => {
    //     itReturnsFunction(sut.useUpdate, baseEndpoint);

    //     it("when not-cancelled, resolves successfully", async () => {
    //         // Arrange
    //         const useUpdate = sut.useUpdate(UserRecord, resourceEndpoint);
    //         const expectedStubRecord = Factory.build<StubResourceRecord>(
    //             FactoryType.recordRecord,
    //             { id: 10 }
    //         );

    //         mockAxios.putSuccess(expectedStubRecord);

    //         const UpdateStubComponent = () => {
    //             const { update } = useUpdate();
    //             const [record, setRecord] = useState<StubResourceRecord>(null as any);

    //             useEffect(() => {
    //                 async function updateUser() {
    //                     const result = await update(expectedStubRecord);
    //                     setRecord(result.resultObject!);
    //                 }
    //                 updateUser();
    //             }, []);

    //             return <div>{record != null && record!.name}</div>;
    //         };

    //         // Act
    //         const { getByText } = render(<UpdateStubComponent />);

    //         // Assert
    //         await wait(() => {
    //             expect(
    //                 getByText(expectedStubRecord.name!)
    //             ).toBeInTheDocument();
    //         });
    //     });

    //     /**
    //      * Test ensures service hook factory in fact protects against a react error
    //      * when the component is unmounted before the promise resolves.
    //      *
    //      * See ServiceFactory.test.tsx for test that verifies react error thrown
    //      */
    //     it("when unmounted before resolution, promise is cancelled successfully", async () => {
    //         // Arrange
    //         const consoleErrorSpy = jest.spyOn(console, "error");

    //         const useUpdate = sut.useUpdate(UserRecord, baseEndpoint);
    //         const record = Factory.build<StubResourceRecord>(FactoryType.recordRecord, {
    //             id: 10,
    //         });

    //         mockAxios.putSuccess(record, cancellationTestsApiDelay);

    //         let isUnmounted = false;

    //         const UpdateStubComponent = () => {
    //             const { update } = useUpdate();
    //             const [record, setRecord] = useState<StubResourceRecord>(null as any);

    //             useEffect(() => {
    //                 async function updateUser() {
    //                     const result = await update(record);
    //                     setRecord(result.resultObject!);
    //                 }

    //                 updateUser();

    //                 return () => {
    //                     isUnmounted = true;
    //                 };
    //             }, []);

    //             return <div>{record != null && record!.name}</div>;
    //         };

    //         // Act
    //         await act(async () => {
    //             const { unmount } = render(<UpdateStubComponent />);
    //             unmount();
    //             // Force a sleep longer than when API promise resolves
    //             await CoreUtils.sleep(cancellationTestsAssertionDelay);
    //         });

    //         // Assert
    //         expect(isUnmounted).toBeTrue();
    //         expect(consoleErrorSpy).not.toHaveBeenCalled();
    //     });
    // });

    // // #endregion useUpdate

    // // ---------------------------------------------------------------------------------------------
    // // #region useBulkUpdate
    // // ---------------------------------------------------------------------------------------------

    // describe("useBulkUpdate", () => {
    //     itReturnsFunction(sut.useBulkUpdate, baseEndpoint);

    //     it("when not-cancelled, resolves successfully", async () => {
    //         // Arrange
    //         const useBulkUpdate = sut.useBulkUpdate(
    //             UserRecord,
    //             resourceEndpoint
    //         );
    //         const expectedStubRecord = Factory.build<StubResourceRecord>(
    //             FactoryType.recordRecord,
    //             { id: 10 }
    //         );

    //         mockAxios.putSuccess([expectedStubRecord]);

    //         const UpdateStubComponent = () => {
    //             const { update } = useBulkUpdate();
    //             const [records, setRecords] = useState<Array<StubResourceRecord>>(
    //                 null as any
    //             );

    //             useEffect(() => {
    //                 async function updateUser() {
    //                     const result = await update([expectedStubRecord], {
    //                         id: expectedStubRecord.id!,
    //                     });
    //                     setRecords(result.resultObjects!);
    //                 }
    //                 updateUser();
    //             }, []);

    //             return <div>{records != null && records[0].name}</div>;
    //         };

    //         // Act
    //         const { getByText } = render(<UpdateStubComponent />);

    //         // Assert
    //         await wait(() => {
    //             expect(
    //                 getByText(expectedStubRecord.name!)
    //             ).toBeInTheDocument();
    //         });
    //     });

    //     /**
    //      * Test ensures service hook factory in fact protects against a react error
    //      * when the component is unmounted before the promise resolves.
    //      *
    //      * See ServiceFactory.test.tsx for test that verifies react error thrown
    //      */
    //     it("when unmounted before resolution, promise is cancelled successfully", async () => {
    //         // Arrange
    //         const consoleErrorSpy = jest.spyOn(console, "error");

    //         const useBulkUpdate = sut.useBulkUpdate(UserRecord, baseEndpoint);
    //         const record = Factory.build<StubResourceRecord>(FactoryType.recordRecord, {
    //             id: 10,
    //         });

    //         mockAxios.putSuccess(record, cancellationTestsApiDelay);

    //         let isUnmounted = false;

    //         const UpdateStubComponent = () => {
    //             const { update } = useBulkUpdate();
    //             const [records, setRecords] = useState<Array<StubResourceRecord>>(
    //                 null as any
    //             );

    //             useEffect(() => {
    //                 async function updateUser() {
    //                     const result = await update([record], {
    //                         id: record.id!,
    //                     });
    //                     setRecords(result.resultObjects!);
    //                 }

    //                 updateUser();

    //                 return () => {
    //                     isUnmounted = true;
    //                 };
    //             }, []);

    //             return <div>{records != null && records[0].name}</div>;
    //         };

    //         // Act
    //         await act(async () => {
    //             const { unmount } = render(<UpdateStubComponent />);
    //             unmount();
    //             // Force a sleep longer than when API promise resolves
    //             await CoreUtils.sleep(cancellationTestsAssertionDelay);
    //         });

    //         // Assert
    //         expect(isUnmounted).toBeTrue();
    //         expect(consoleErrorSpy).not.toHaveBeenCalled();
    //     });
    // });

    // // #endregion useBulkUpdate
});

// #endregion Tests
