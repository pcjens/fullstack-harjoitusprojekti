import { Dispatch, SetStateAction } from "react";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { useTranslation } from "react-i18next";

/**
 * @param value The input value.
 * @returns A localized error string or null if the input is valid.
 */
type Validator = (value: boolean) => string | null;

export interface Props {
    showPlaceholder?: boolean,

    name: string,
    /**
     * Prefix to add before `name` to form the translation key. E.g. is name:
     * "foo", tPrefix: "bar", the help string will be bar.foo.help
     */
    pfx: string,
    shouldValidate: boolean,
    validate: Validator,

    input: boolean,
    setInput: Dispatch<SetStateAction<boolean>>,
}

export const ValidatedCheckbox = (props: Props) => {
    const { t } = useTranslation();

    const controlName = `${props.name}InputControl`;
    const helpName = `${props.name}InputHelp`;

    const error = props.shouldValidate ? props.validate(props.input) : null;

    return (
        <Form.Group controlId={controlName}>
            <InputGroup className="d-flex justify-content-between" hasValidation>
                <Form.Label style={{ marginBottom: 0 }}>{t(`${props.pfx}.${props.name}.name`)}</Form.Label>
                <Form.Switch required aria-describedby={helpName}
                    // Apparently Form.Switch/Check is a div with the input
                    // inside, and these classes are applied to the inner
                    // element. They need to be applied to the sibling of the
                    // Form.Control.Feedback, so here we are:
                    className={props.shouldValidate ? (error == null ? "is-valid" : "is-invalid") : ""}
                    disabled={!!props.showPlaceholder}
                    isInvalid={props.shouldValidate && error != null}
                    isValid={props.shouldValidate && error == null}
                    checked={props.input} onChange={(({ target }) => { props.setInput(target.checked); })} />
                {props.shouldValidate && error != null && <Form.Control.Feedback type="invalid" style={{ marginTop: 0 }}>
                    {error}
                </Form.Control.Feedback>}
            </InputGroup>
            <Form.Text id={helpName} muted>
                {t(`${props.pfx}.${props.name}.help`)}
            </Form.Text>
        </Form.Group>
    );
};
