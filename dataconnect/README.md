# Firebase Data Connect (Tok-Edge)

## What you control (edit these)

- **dataconnect.yaml** – service id, location, schema source, datasource, `connectorDirs`
- **schema/schema.gql** – your table definitions
- **connector/*.gql** – your queries and mutations
- **connector/connector.yaml** – connector id and admin SDK output config only

## What the CLI generates (do not edit)

- **.dataconnect/** – generated schema cache (implicit types, etc.). Ignored in git. Recreated when you run deploy or sdk:generate.
- **src/dataconnect-generated/** – generated Node admin SDK. Overwritten by `firebase dataconnect:sdk:generate`.

## Safe way to generate the SDK

1. From the **project root** (not inside `dataconnect/`):
   ```bash
   firebase dataconnect:sdk:generate
   ```
2. If the CLI asks to overwrite files:
   - **Do not overwrite** `dataconnect.yaml`, `schema/schema.gql`, or `connector/connector.yaml` if you changed them.
   - **Allow overwrite** only for `src/dataconnect-generated/` (that’s the generated SDK).

## If the CLI changed your config

- **connector.yaml** should contain a single `adminNodeSdk` block (see current `connector/connector.yaml`). If it was turned into a list or a second SDK was added, restore the single-block version.
- **dataconnect.yaml** should list only the connectors you use, e.g. `connectorDirs: [./connector]`. Remove `./example` from `connectorDirs` if you don’t use the example connector.

## Example folder

The **example/** folder (with its own connector.yaml) is not in `connectorDirs` in `dataconnect.yaml`, so it is not used by the app. You can delete it if you don’t need it, to avoid confusion.
