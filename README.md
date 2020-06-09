# AWS S3 Deploy GitHub Action

### Easily deploy a static website to AWS S3 and invalidate CloudFront distribution

This action is based on the work done by import-io on [s3-deploy](https://github.com/import-io/s3-deploy#readme).

## Usage

To deploy your static website with your Actions pipeline, specify the name of this repository with a tag number (`@v1` is recommended) as a `step` within your `workflow.yml` file.

Inside your `.github/workflows/workflow.yml` file:

```yaml
steps:
- uses: actions/checkout@master
- uses: codecov/codecov-action@v1
  with:
    token: ${{ secrets.CODECOV_TOKEN }} # not required for public repos
    file: ./coverage.xml # optional
    flags: unittests # optional
    name: codecov-umbrella # optional
    fail_ci_if_error: true # optional (default = false)
```
>**Note**: This assumes that you've set your Codecov token inside *Settings > Secrets* as `CODECOV_TOKEN`. If not, you can [get an upload token](https://docs.codecov.io/docs/frequently-asked-questions#section-where-is-the-repository-upload-token-found-) for your specific repo on [codecov.io](https://www.codecov.io). Keep in mind that secrets are *not* available to forks of repositories.

## Arguments

S3 Deploy's Action supports three inputs from the user: `folder`, `bucket` and `dist-id`. These inputs, along with their descriptions and usage contexts, are listed in the table below:

| Input  | Description | Usage |
| :---:     |     :---:   |    :---:   |
| `folder`  | The folder to upload  | *Required* |
| `bucket`  | The destination bucket | *Required*
| `dist-id`  | The CloudFront Distribution ID to invalidate | *Required*

### Example `workflow.yml` with Codecov Action

```yaml
name: Example workflow for S3 Deploy
on: [push]
jobs:
  run:
    runs-on: ubuntu-latest
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_DEFAULT_REGION: ${{ secrets.AWS_DEFAULT_REGION }}
    steps:
        - uses: actions/checkout@v1

        - name: Install dependencies
          run: yarn

        - name: Build
          run: yarn build

        - name: Deploy
          uses: reggionick/s3-deploy@v1
          with:
            folder: build
            bucket: ${{ secrets.S3_BUCKET }}
            dist-id: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
```

## License

The code in this project is released under the [MIT License](LICENSE).
