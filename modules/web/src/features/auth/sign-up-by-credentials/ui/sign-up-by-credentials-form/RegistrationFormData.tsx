import { Input } from "@/shared/layout/input";
import { RegistrationData } from "./sign-up-by-credentials-form";

interface RegFormDataProps {
    registrationData: RegistrationData;
    setRegistrationData: React.Dispatch<React.SetStateAction<RegistrationData>>;
}

export function RegistrationFormData({
    registrationData,
    setRegistrationData,
}: RegFormDataProps): JSX.Element {
    return (
        <div className="flex flex-col w-full gap-4 sm:mt-5 lg:w-1/2">
            <h1 className="font-bold text-center text-5xl pb-3 lg:text-left lg:text-6xl lg:pb-6">
                Sign up
            </h1>
            <Input
                type={"text"}
                name={"name"}
                required={false}
                id={"name"}
                placeholder={"Name"}
                value={registrationData}
                setValue={setRegistrationData}
            />
            <Input
                type={"text"}
                name={"surname"}
                required={true}
                id={"surname"}
                placeholder={"Surname"}
                value={registrationData}
                setValue={setRegistrationData}
            />
            <Input
                type={"text"}
                name={"nickname"}
                required={true}
                id={"nickname"}
                placeholder={"Nickname"}
                value={registrationData}
                setValue={setRegistrationData}
            />
            <Input
                type={"email"}
                name={"email"}
                required={true}
                id={"email"}
                placeholder={"E-mail"}
                value={registrationData}
                setValue={setRegistrationData}
            />
            <Input
                type={"password"}
                name={"password"}
                required={true}
                id={"password"}
                placeholder={"Confirm your password"}
                value={registrationData}
                setValue={setRegistrationData}
            />
            <Input
                type={"password"}
                name={"passwordConfirmation"}
                required={true}
                id={"passwordConfirmation"}
                placeholder={"Confirm your password"}
                value={registrationData}
                setValue={setRegistrationData}
            />
            <button
                className="bg-slate-50 text-slate-700 border-solid border-2 border-slate-700 text-lg w-full p-4 rounded-full font-medium sm:mt-10 sm:text-xl sm:p-4 lg:w-96 lg:self-end lg:mt-20 ease-in-out duration-300 hover:bg-slate-700 hover:text-slate-50"
                type="submit"
            >
                Create account
            </button>
        </div>
    );
}
